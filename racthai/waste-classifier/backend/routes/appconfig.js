/**
 * appconfig.js - QUAN LY CAU HINH APP
 * Public: GET config
 * Admin: PUT config, POST logo upload
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/database');
const { yeuCauDangNhap, yeuCauAdmin } = require('../middleware/auth');

// Cau hinh upload logo
const logoDir = path.join(__dirname, '../uploads/logo');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, logoDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `logo-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml'].includes(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Chi chap nhan JPG, PNG, WEBP, SVG'));
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// GET /api/app-config - lay tat ca config (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT config_key, config_value, description FROM app_config');
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    res.json({ success: true, config });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/app-config - admin cap nhat config
router.put('/', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || !Object.keys(updates).length)
      return res.status(400).json({ success: false, message: 'Khong co du lieu.' });

    for (const [key, value] of Object.entries(updates)) {
      await db.execute(
        `INSERT INTO app_config (config_key, config_value)
         VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [key, value ?? '']
      );
    }
    res.json({ success: true, message: 'Cap nhat thanh cong!' });
  } catch (e) {
    console.error('[APP CONFIG]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/app-config/logo - upload logo moi
router.post('/logo', yeuCauDangNhap, yeuCauAdmin, (req, res) => {
  logoUpload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui long chon file.' });

    try {
      const logoUrl = `/uploads/logo/${req.file.filename}`;

      // Xoa logo cu neu co
      const [old] = await db.execute("SELECT config_value FROM app_config WHERE config_key = 'app_logo'");
      if (old[0]?.config_value) {
        const oldPath = path.join(__dirname, '..', old[0].config_value);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.execute(
        `INSERT INTO app_config (config_key, config_value) VALUES ('app_logo', ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [logoUrl]
      );
      res.json({ success: true, message: 'Upload logo thanh cong!', logo_url: logoUrl });
    } catch (e) {
      console.error('[LOGO UPLOAD]', e);
      res.status(500).json({ success: false, message: 'Loi server.' });
    }
  });
});

// DELETE /api/app-config/logo - xoa logo
router.delete('/logo', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const [old] = await db.execute("SELECT config_value FROM app_config WHERE config_key = 'app_logo'");
    if (old[0]?.config_value) {
      const oldPath = path.join(__dirname, '..', old[0].config_value);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    await db.execute("UPDATE app_config SET config_value = '' WHERE config_key = 'app_logo'");
    res.json({ success: true, message: 'Da xoa logo.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
