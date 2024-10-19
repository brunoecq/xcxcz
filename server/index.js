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
        [userId || null, lang.language || null, lang.level || null]
      );
    }

    // Insert availability
    for (const slot of availability) {
      await pool.execute(
        'INSERT INTO availability (userId, day, startTime, endTime) VALUES (?, ?, ?, ?)',
        [userId || null, slot.day || null, slot.startTime || null, slot.endTime || null]
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
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email || null]);

    if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
      const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, process.env.JWT_SECRET, { expiresIn: '5m' });
      
      // Fetch learning languages
      const [learningLanguages] = await pool.execute('SELECT language, level FROM learning_languages WHERE userId = ?', [rows[0].id || null]);
      
      // Fetch availability
      const [availability] = await pool.execute('SELECT day, startTime, endTime FROM availability WHERE userId = ?', [rows[0].id || null]);
      
      //const user = { ...rows[0], password: undefined, learningLanguages, availability };
      //res.json({ token, user });
      res.json({ token });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '5m' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users', authenticateToken, async (req, res) => {
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
    const { senderId, receiverId, roomId, text } = req.body;
    const [result] = await pool.query(
      'INSERT INTO messages (senderId, receiverId, roomId, text) VALUES (?, ?, ?, ?)',
      [senderId, receiverId || null, roomId || null, text]
    );
    const [newMessage] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.status(201).json(newMessage[0]);

    // Emit the new message to the appropriate room or user
    if (roomId) {
      io.to(`room_${roomId}`).emit('new_message', newMessage[0]);
    } else if (receiverId) {
      io.to(`user_${receiverId}`).emit('new_message', newMessage[0]);
      io.to(`user_${senderId}`).emit('new_message', newMessage[0]);
    }
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/messages/:userId1/:userId2', authenticateToken, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [userId1, userId2, userId2, userId1, Number(limit), offset]
    );
    res.json(rows.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/room-messages/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      'SELECT m.*, u.name as senderName FROM messages m JOIN users u ON m.senderId = u.id WHERE m.roomId = ? ORDER BY m.createdAt DESC LIMIT ? OFFSET ?',
      [roomId, Number(limit), offset]
    );
    res.json(rows.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { reviewerId, reviewedId, rating, comment } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO reviews (reviewerId, reviewedId, rating, comment) VALUES (?, ?, ?, ?)',
      [reviewerId || null, reviewedId || null, rating || null, comment || null]
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
      [reporterId || null, reportedId || null, reason || null]
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
      [blockerId || null, blockedId || null]
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
    
    // Update user information
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, nativeLanguage = ?, country = ?, timezone = ?, allowRandomCalls = ? WHERE id = ?',
      [name || null, email || null, nativeLanguage || null, country || null, timezone || null, allowRandomCalls || null, id || null]
    );

    // Update learning languages
    await pool.execute('DELETE FROM learning_languages WHERE userId = ?', [id || null]);
    for (const lang of learningLanguages) {
      await pool.execute(
        'INSERT INTO learning_languages (userId, language, level) VALUES (?, ?, ?)',
        [id || null, lang.language || null, lang.level || null]
      );
    }

    // Update availability
    await pool.execute('DELETE FROM availability WHERE userId = ?', [id || null]);
    for (const slot of availability) {
      await pool.execute(
        'INSERT INTO availability (userId, day, startTime, endTime) VALUES (?, ?, ?, ?)',
        [id || null, slot.day || null, slot.startTime || null, slot.endTime || null]
      );
    }

    // Fetch updated user data
    const [updatedUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [id || null]);
    const [updatedLearningLanguages] = await pool.execute('SELECT language, level FROM learning_languages WHERE userId = ?', [id || null]);
    const [updatedAvailability] = await pool.execute('SELECT day, startTime, endTime FROM availability WHERE userId = ?', [id || null]);

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

// Room routes
app.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE is_active = 1');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, language, level, description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO rooms (name, language, level, description, created_by, host_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, language || null, level || null, description || null, req.user.id || null, req.user.id || null]
    );
    const roomId = result.insertId;
    res.status(201).json({ id: roomId, name, language, level, description, createdBy: req.user.id, hostId: req.user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rooms/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    await pool.execute('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)', [roomId || null, req.user.id || null]);
    res.status(200).json({ message: 'Joined room successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rooms/:roomId/leave', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    await pool.execute('DELETE FROM room_users WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    res.status(200).json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/rooms/:roomId/assign-cohost', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    await pool.execute('UPDATE rooms SET cohost_id = ? WHERE id = ?', [userId || null, roomId || null]);
    res.status(200).json({ message: 'Co-host assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket and WebRTC
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_room', async ({ roomId, user }) => {
    socket.join(`room_${roomId}`);
    socket.to(`room_${roomId}`).emit('user_joined', user);
    try {
      await pool.execute('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)', [roomId || null, user.id || null]);
      await pool.execute('UPDATE rooms SET last_activity = NOW() WHERE id = ?', [roomId || null]);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  socket.on('leave_room', async ({ roomId, userId }) => {
    socket.leave(`room_${roomId}`);
    socket.to(`room_${roomId}`).emit('user_left', userId);
    try {
      await pool.execute('DELETE FROM room_users WHERE room_id = ? AND user_id = ?', [roomId, userId]);
      await pool.execute('UPDATE rooms SET last_activity = NOW() WHERE id = ?', [roomId]);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('send_message', async (message) => {
    if (message.roomId) {
      io.to(`room_${message.roomId}`).emit('new_message', message);
    } else {
      io.to(`user_${message.receiverId}`).emit('new_message', message);
    }
    // try {
    //   await pool.execute(
    //     'INSERT INTO messages (senderId, receiverId, roomId, text) VALUES (?, ?, ?, ?)',
    //     [message.senderId || null, message.receiverId || null, message.roomId || null, message.text || null]
    //   );
    //   if (message.roomId) {
    //     await pool.execute('UPDATE rooms SET last_activity = NOW() WHERE id = ?', [message.roomId || null]);
    //   }
    // } catch (error) {
    //   console.error('Error saving message:', error);
    // }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Function to remove inactive rooms
const removeInactiveRooms = async () => {
  try {
    await pool.execute('UPDATE rooms SET is_active = 0 WHERE last_activity < DATE_SUB(NOW(), INTERVAL 10 MINUTE)');
  } catch (error) {
    console.error('Error removing inactive rooms:', error);
  }
};

// Set interval to remove inactive rooms every minute
setInterval(removeInactiveRooms, 60000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
