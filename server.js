// server.js — infiniT Express API Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const isVercel = !!process.env.VERCEL;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Uploads dir (Vercel only has /tmp writable)
const UPLOAD_DIR = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// File upload
const multer = require('multer');
const { v4: uuid } = require('uuid');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Routes (loaded after middleware, DB init happens on first request)
app.use('/api/auth',    require('./routes/auth'));
app.use('/api',         require('./routes/public'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/members', require('./routes/members'));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api'))
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  else res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Vercel serverless: init DB once, then handle requests
let dbInitialized = false;
module.exports = async (req, res) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
      console.log('✓ DB initialized on first request');
    } catch (err) {
      console.error('✗ DB init failed:', err);
      return res.status(500).json({ error: 'Database initialization failed', detail: err.message });
    }
  }
  app(req, res);
};

// Local development
if (!isVercel) {
  initDb().then(() => {
    app.listen(PORT, () => console.log(`\n  ⚡ infiniT → http://localhost:${PORT}\n`));
  });
}
