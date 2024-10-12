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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '20m'; // 20 minutes

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
      const user = { id: rows[0].id, email: rows[0].email };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      
      // Fetch learning languages
      const [learningLanguages] = await pool.execute('SELECT language, level FROM learning_languages WHERE userId = ?', [rows[0].id]);
      
      // Fetch availability
      const [availability] = await pool.execute('SELECT day, startTime, endTime FROM availability WHERE userId = ?', [rows[0].id]);
      
      const userResponse = { ...rows[0], password: undefined, learningLanguages, availability };
      res.json({ token, user: userResponse });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, nativeLanguage, learningLanguages, country, timezone, availability } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, nativeLanguage, country, timezone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, nativeLanguage, country, timezone]
    );

    const userId = result.insertId;

    // Insert learning languages
    for (const lang of learningLanguages) {
      await pool.execute(
        'INSERT INTO learning_languages (userId, language, level) VALUES (?, ?, ?)',
        [userId, lang.language, lang.level]
      );
    }

    // Insert availability
    for (const slot of availability) {
      await pool.execute(
        'INSERT INTO availability (userId, day, startTime, endTime) VALUES (?, ?, ?, ?)',
        [userId, slot.day, slot.startTime, slot.endTime]
      );
    }

    res.status(201).json({ message: 'User registered successfully', userId: userId });
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

// ... (rest of the routes remain the same)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));