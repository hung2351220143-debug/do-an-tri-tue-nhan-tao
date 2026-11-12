/**
 * server.js - FILE KHOI DONG SERVER CHINH
 * Khoi tao Express server, ket noi cac route va middleware
 */
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const fs         = require('fs');
const http       = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5000', /\.ngrok(-free)?\.app$/, /\.ngrok\.io$/, '*'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 20e6
});

// Khoi tao Socket.io chat handler
const { initSocket } = require('./socket/chatHandler');
initSocket(io);

const PORT = process.env.PORT || 5000;

// Tao thu muc chua anh neu chua co
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Tao thu muc upload recycle neu chua co
const recycleUploadDir = path.join(__dirname, 'uploads', 'recycle');
if (!fs.existsSync(recycleUploadDir)) fs.mkdirSync(recycleUploadDir, { recursive: true });

// ============================================
// MIDDLEWARE CO BAN
// ============================================
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép: localhost, IP LAN, ngrok, không có origin (mobile app/curl)
    if (!origin) return callback(null, true)
    const allowed = [
      /^http:\/\/localhost/,
      /^http:\/\/127\./,
      /^http:\/\/192\.168\./,
      /^http:\/\/10\./,
      /^https?:\/\/.*\.ngrok(-free)?\.app$/,
      /^https?:\/\/.*\.ngrok\.io$/,
    ]
    const ok = allowed.some(r => r.test(origin))
    if (ok) return callback(null, true)
    // Nếu có FRONTEND_URL cụ thể thì cũng cho phép
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true)
    callback(null, true) // dev mode: allow all
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Bypass ngrok browser warning cho TẤT CẢ request (kể cả crawler PWABuilder)
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true')
  res.setHeader('Bypass-Tunnel-Reminder', 'true')
  next()
})

// Phuc vu manifest.json va manifest.webmanifest voi dung Content-Type
app.get('/manifest.json', (req, res) => {
  const mPath = path.join(__dirname, '..', 'frontend-vue', 'dist', 'manifest.json');
  const mPath2 = path.join(__dirname, '..', 'frontend-vue', 'public', 'manifest.json');
  const filePath = fs.existsSync(mPath) ? mPath : mPath2;
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'manifest not found' });
  }
});

app.get('/manifest.webmanifest', (req, res) => {
  const mPath = path.join(__dirname, '..', 'frontend-vue', 'dist', 'manifest.webmanifest');
  if (fs.existsSync(mPath)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(mPath);
  } else {
    res.status(404).json({ error: 'manifest not found' });
  }
});

// Phuc vu uploads
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/avatars',  express.static(path.join(__dirname, 'uploads', 'avatars')));
app.use('/uploads/logo',     express.static(path.join(__dirname, 'uploads', 'logo')));
app.use('/uploads/chat',     express.static(path.join(__dirname, 'uploads', 'chat')));
app.use('/uploads/banners',  express.static(path.join(__dirname, 'uploads', 'banners')));
app.use('/uploads/recycle',  express.static(path.join(__dirname, 'uploads', 'recycle')));

// ============================================
// GIOI HAN SO LUONG REQUEST (chong spam)
// ============================================
// Gioi han chung: 200 req / 15 phut
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Qua nhieu yeu cau, vui long thu lai sau.' }
}));

// Gioi han AI: 10 req / phut (tiet kiem quota Gemini)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Da vuot gioi han AI, vui long doi 1 phut.' }
});
app.use('/api/classify', aiLimiter);
app.use('/api/chat', aiLimiter);

// ============================================
// CAC ROUTE
// ============================================
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/classify',   require('./routes/classify'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/history',    require('./routes/history'));
app.use('/api/ratings',    require('./routes/ratings'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/app-config', require('./routes/appconfig'));
app.use('/api/staff-chat', require('./routes/staffchat'));
app.use('/api/banners',    require('./routes/banner'));
app.use('/api/recycle',   require('./routes/recycle'));

// Kiem tra server con song khong
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server dang hoat dong', time: new Date() });
});

// ============================================
// PHUC VU FRONTEND VUE (dist)
// ============================================
const frontendDist = path.join(__dirname, '..', 'frontend-vue', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Tra ve index.html cho moi route de Vue Router xu ly
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Xu ly 404 khi chua build frontend
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Khong tim thay endpoint nay. Frontend chua duoc build.' });
  });
}

// Xu ly loi chung
app.use((err, req, res, next) => {
  console.error('[LOI SERVER]', err.message);
  res.status(500).json({
    success: false,
    message: 'Loi server noi bo.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server chay tai: http://localhost:${PORT}`);
  console.log(`📁 Thu muc anh:    http://localhost:${PORT}/uploads`);
  console.log(`⚡ Socket.io:      ws://localhost:${PORT}`);
});

