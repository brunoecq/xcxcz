require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, nativeLanguage, learningLanguages, country, timezone, availability } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, nativeLanguage, country, timezone) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, email || null, hashedPassword || null, nativeLanguage || null, country || null, timezone || null]
    );

    const userId = result.insertId;

    // Insert learning languages
    for (const lang of learningLanguages) {
      await pool.execute(
        'INSERT INTO learning_languages (userId, language, level) VALUES (?, ?, ?)',
        [userId, lang.language, lang.level]
      );
    }

    res.status(201).json({ message: 'User registered successfully', userId: userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
      const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Fetch learning languages
      const [learningLanguages] = await pool.execute('SELECT language, level FROM learning_languages WHERE userId = ?', [rows[0].id]);
      
      // Fetch availability
      const [availability] = await pool.execute('SELECT day, startTime, endTime FROM availability WHERE userId = ?', [rows[0].id]);
      
      const user = { ...rows[0], password: undefined, learningLanguages, availability };
      res.json({ token, user });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, nativeLanguage, country, timezone, allowRandomCalls FROM users');
    
    // Fetch learning languages and availability for each user
    for (let user of rows) {
      const [learningLanguages] = await pool.execute('SELECT language, level FROM learning_languages WHERE userId = ?', [user.id]);
      const [availability] = await pool.execute('SELECT day, startTime, endTime FROM availability WHERE userId = ?', [user.id]);
      user.learningLanguages = learningLanguages;
      user.availability = availability;
    }
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/chats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(`
      SELECT DISTINCT
        CASE
          WHEN senderId = ? THEN receiverId
          ELSE senderId
        END as otherUserId,
        (SELECT name FROM users WHERE id = otherUserId) as name,
        (SELECT text FROM messages WHERE (senderId = ? AND receiverId = otherUserId) OR (senderId = otherUserId AND receiverId = ?) ORDER BY createdAt DESC LIMIT 1) as lastMessage,
        (SELECT createdAt FROM messages WHERE (senderId = ? AND receiverId = otherUserId) OR (senderId = otherUserId AND receiverId = ?) ORDER BY createdAt DESC LIMIT 1) as lastMessageDate
      FROM messages
      WHERE senderId = ? OR receiverId = ?
    `, [userId, userId, userId, userId, userId, userId, userId]);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO messages (senderId, receiverId, text) VALUES (?, ?, ?)',
      [senderId, receiverId, text]
    );
    const [newMessage] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.status(201).json(newMessage[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/messages/:userId1/:userId2', authenticateToken, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt',
      [userId1, userId2, userId2, userId1]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { reviewerId, reviewedId, rating, comment } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO reviews (reviewerId, reviewedId, rating, comment) VALUES (?, ?, ?, ?)',
      [reviewerId, reviewedId, rating, comment]
    );
    res.status(201).json({ message: 'Review submitted successfully', reviewId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/report', authenticateToken, async (req, res) => {
  try {
    const { reporterId, reportedId, reason } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO reports (reporterId, reportedId, reason) VALUES (?, ?, ?)',
      [reporterId, reportedId, reason]
    );
    res.status(201).json({ message: 'User reported successfully', reportId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/block', authenticateToken, async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;
    await pool.execute(
      'INSERT INTO blocked_users (blockerId, blockedId) VALUES (?, ?)',
      [blockerId, blockedId]
    );
    res.status(201).json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/block', authenticateToken, async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;
    await pool.execute(
      'DELETE FROM blocked_users WHERE blockerId = ? AND blockedId = ?',
      [blockerId, blockedId]
    );
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { id, name, email, nativeLanguage, learningLanguages, country, timezone, availability, allowRandomCalls } = req.body;
    
    // Ensure all values are defined, use null for undefined values
    const safeValues = [
      name || null,
      email || null,
      nativeLanguage || null,
      country || null,
      timezone || null,
      availability ? JSON.stringify(availability) : null,
      allowRandomCalls !== undefined ? allowRandomCalls : null,
      id
    ];

    // Log the safeValues for debugging
    console.log('Safe values for update:', safeValues);

    // Update user information
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, nativeLanguage = ?, country = ?, timezone = ?, allowRandomCalls = ? WHERE id = ?',
      [name || null, email || null, nativeLanguage || null, country || null, timezone || null, allowRandomCalls !== undefined ? allowRandomCalls : null, id]
    );

    // Update learning languages
    await pool.execute('DELETE FROM learning_languages WHERE userId = ?', [id]);
    if (Array.isArray(learningLanguages)) {
      for (const lang of learningLanguages) {
        if (lang && lang.language && lang.level) {
          await pool.execute(
            'INSERT INTO learning_languages (userId, language, level) VALUES (?, ?, ?)',
            [id, lang.language, lang.level]
          );
        }
      }
    }

    // Update availability
    await pool.execute('DELETE FROM availability WHERE userId = ?', [id]);
    if (Array.isArray(availability)) {
      for (const slot of availability) {
        if (slot && slot.day && slot.startTime && slot.endTime) {
          await pool.execute(
            'INSERT INTO availability (userId, day, startTime, endTime) VALUES (?, ?, ?, ?)',
            [id, slot.day, slot.startTime, slot.endTime]
          );
        }
      }
    }

    // Fetch updated user data
    const [updatedUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const [updatedLearningLanguages] = await pool.execute('SELECT language, level FROM learning_languages WHERE userId = ?', [id]);
    const [updatedAvailability] = await pool.execute('SELECT day, startTime, endTime FROM availability WHERE userId = ?', [id]);

    const userResponse = {
      ...updatedUser[0],
      password: undefined,
      learningLanguages: updatedLearningLanguages,
      availability: updatedAvailability
    };

    res.json({ message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket and WebRTC
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('chat message', async (msg) => {
    try {
      const { senderId, receiverId, text } = msg;
      const [result] = await pool.execute(
        'INSERT INTO messages (senderId, receiverId, text) VALUES (?, ?, ?)',
        [senderId, receiverId, text]
      );
      const [newMessage] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
      io.to(receiverId).emit('chat message', newMessage[0]);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('call user', (data) => {
    io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from });
  });

  socket.on('accept call', (data) => {
    io.to(data.to).emit('call accepted', data.signal);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));