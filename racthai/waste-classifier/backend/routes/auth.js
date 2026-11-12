/**
 * auth.js - ROUTE XAC THUC & QUAN LY TAI KHOAN
 * API: dang ky, dang nhap, thong tin ca nhan, cap nhat profile, doi mat khau, upload avatar
 */
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const db       = require('../config/database');
const { yeuCauDangNhap } = require('../middleware/auth');

const BI_MAT_JWT = process.env.JWT_SECRET    || 'bi_mat_mac_dinh';
const HAN_TOKEN  = process.env.JWT_EXPIRES_IN || '7d';

// Tao JWT token
const taoToken = (userId, role) => jwt.sign({ userId, role }, BI_MAT_JWT, { expiresIn: HAN_TOKEN });

// Cau hinh upload avatar rieng (luu vao /uploads/avatars/)
const avatarDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Chi chap nhan JPG, PNG, WEBP'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB cho avatar
});

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Vui long dien day du thong tin.' });
    if (username.length < 3 || username.length > 50)
      return res.status(400).json({ success: false, message: 'Ten dang nhap phai tu 3 den 50 ky tu.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Email khong hop le.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Mat khau phai it nhat 6 ky tu.' });

    const [ton_tai] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?', [email, username]
    );
    if (ton_tai.length)
      return res.status(409).json({ success: false, message: 'Email hoac ten dang nhap da duoc su dung.' });

    const matKhauMaHoa = await bcrypt.hash(password, 10);
    const [kq] = await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, matKhauMaHoa, 'user']
    );

    res.status(201).json({
      success: true,
      message: 'Dang ky thanh cong!',
      token: taoToken(kq.insertId, 'user'),
      user: { id: kq.insertId, username, email, role: 'user', avatar: null, phone: null, full_name: null }
    });
  } catch (loi) {
    console.error('[LOI DANG KY]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Vui long nhap email va mat khau.' });

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Email hoac mat khau khong dung.' });

    const user = rows[0];
    if (!user.is_active)
      return res.status(403).json({ success: false, message: 'Tai khoan da bi khoa.' });

    const hopLe = await bcrypt.compare(password, user.password_hash);
    if (!hopLe)
      return res.status(401).json({ success: false, message: 'Email hoac mat khau khong dung.' });

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Dang nhap thanh cong!',
      token: taoToken(user.id, user.role),
      user: {
        id: user.id, username: user.username, email: user.email,
        role: user.role, avatar: user.avatar, phone: user.phone, full_name: user.full_name
      }
    });
  } catch (loi) {
    console.error('[LOI DANG NHAP]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/auth/me
// ============================================
router.get('/me', yeuCauDangNhap, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, avatar, phone, full_name, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// PUT /api/auth/profile - CAP NHAT THONG TIN
// ============================================
router.put('/profile', yeuCauDangNhap, async (req, res) => {
  try {
    const { username, email, phone, full_name } = req.body;

    // Validate
    if (username && (username.length < 3 || username.length > 50))
      return res.status(400).json({ success: false, message: 'Ten dang nhap phai tu 3 den 50 ky tu.' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Email khong hop le.' });
    if (phone && !/^[0-9+\-\s()]{8,15}$/.test(phone))
      return res.status(400).json({ success: false, message: 'So dien thoai khong hop le.' });

    // Kiem tra trung username/email voi nguoi khac
    if (username || email) {
      const [dup] = await db.execute(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username || '', email || '', req.user.id]
      );
      if (dup.length)
        return res.status(409).json({ success: false, message: 'Username hoac email da ton tai.' });
    }

    // Build UPDATE query dong
    const fields = [];
    const values = [];
    if (username)  { fields.push('username = ?');  values.push(username); }
    if (email)     { fields.push('email = ?');     values.push(email); }
    if (phone !== undefined)     { fields.push('phone = ?');     values.push(phone || null); }
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name || null); }

    if (!fields.length)
      return res.status(400).json({ success: false, message: 'Khong co thong tin nao duoc cap nhat.' });

    values.push(req.user.id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.execute(
      'SELECT id, username, email, role, avatar, phone, full_name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, message: 'Cap nhat thanh cong!', user: rows[0] });
  } catch (loi) {
    console.error('[LOI CAP NHAT PROFILE]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// POST /api/auth/avatar - UPLOAD ANH DAI DIEN
// ============================================
router.post('/avatar', yeuCauDangNhap, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui long chon anh.' });

    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Xoa avatar cu neu co
      const [old] = await db.execute('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
      if (old[0]?.avatar && old[0].avatar.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '..', old[0].avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
      res.json({ success: true, message: 'Cap nhat anh dai dien thanh cong!', avatar: avatarUrl });
    } catch (loi) {
      console.error('[LOI UPLOAD AVATAR]', loi);
      res.status(500).json({ success: false, message: 'Loi server.' });
    }
  });
});

// ============================================
// PUT /api/auth/change-password
// ============================================
router.put('/change-password', yeuCauDangNhap, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Vui long dien day du.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Mat khau moi phai it nhat 6 ky tu.' });

    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const hopLe  = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!hopLe)
      return res.status(401).json({ success: false, message: 'Mat khau hien tai khong dung.' });

    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [await bcrypt.hash(newPassword, 10), req.user.id]
    );
    res.json({ success: true, message: 'Doi mat khau thanh cong!' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// POST /api/auth/feedback - GUI PHAN HOI
// ============================================
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ success: false, message: 'Vui long dien day du thong tin.' });

    const userId = req.user?.id || null;
    await db.execute(
      'INSERT INTO feedbacks (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, subject, message]
    );
    res.json({ success: true, message: 'Gui phan hoi thanh cong! Chung toi se phan hoi som nhat co the.' });
  } catch (loi) {
    console.error('[LOI GUI PHAN HOI]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// POST /api/auth/ratings - DANH GIA KET QUA
// ============================================
router.post('/ratings', yeuCauDangNhap, async (req, res) => {
  try {
    const { classification_id, stars, comment } = req.body;
    if (!classification_id || !stars || stars < 1 || stars > 5)
      return res.status(400).json({ success: false, message: 'Du lieu danh gia khong hop le.' });

    await db.execute(
      `INSERT INTO ratings (classification_id, user_id, stars, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stars = VALUES(stars), comment = VALUES(comment)`,
      [classification_id, req.user.id, stars, comment || null]
    );
    res.json({ success: true, message: 'Cam on ban da danh gia!' });
  } catch (loi) {
    console.error('[LOI DANH GIA]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/auth/my-feedbacks - LICH SU PHAN HOI CUA USER
// ============================================
router.get('/my-feedbacks', yeuCauDangNhap, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, subject, message, status, admin_reply, replied_at, created_at
       FROM feedbacks WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, feedbacks: rows });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
