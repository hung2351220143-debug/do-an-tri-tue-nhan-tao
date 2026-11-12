/**
 * banner.js - QUAN LY BANNER/CAROUSEL TRANG CHU
 * Public: GET banners
 * Staff+Admin: POST/PUT/DELETE banner
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/database');
const { yeuCauDangNhap } = require('../middleware/auth');

const bannerDir = path.join(__dirname, '../uploads/banners');
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });

const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, bannerDir),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `banner-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/');
    ok ? cb(null, true) : cb(new Error('Chi chap nhan file anh'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware: staff hoac admin
const yeuCauStaffOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'staff' && req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Khong co quyen.' });
  next();
};

// GET /api/banners - lay tat ca banner dang active (public)
router.get('/', async (req, res) => {
  try {
    const all = req.query.all === '1';
    const where = all ? '' : 'WHERE b.is_active=1';
    const [banners] = await db.execute(
      `SELECT b.*, u.username as created_by_name
       FROM banner_slides b LEFT JOIN users u ON b.created_by=u.id
       ${where} ORDER BY b.sort_order ASC, b.created_at DESC`
    );
    res.json({ success: true, banners });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// POST /api/banners - them banner moi (staff/admin)
router.post('/', yeuCauDangNhap, yeuCauStaffOrAdmin, (req, res) => {
  bannerUpload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui long chon anh.' });
    try {
      const { title, subtitle, link_url, sort_order } = req.body;
      const imageUrl = `/uploads/banners/${req.file.filename}`;
      const [r] = await db.execute(
        `INSERT INTO banner_slides (title, subtitle, image_url, link_url, sort_order, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title||null, subtitle||null, imageUrl, link_url||null, parseInt(sort_order)||0, req.user.id]
      );
      res.json({ success: true, message: 'Da them banner!', id: r.insertId, image_url: imageUrl });
    } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
  });
});

// PUT /api/banners/:id - sua banner
router.put('/:id', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const { title, subtitle, link_url, sort_order, is_active } = req.body;
    const fields = [], values = [];
    if (title !== undefined)      { fields.push('title=?');      values.push(title); }
    if (subtitle !== undefined)   { fields.push('subtitle=?');   values.push(subtitle); }
    if (link_url !== undefined)   { fields.push('link_url=?');   values.push(link_url); }
    if (sort_order !== undefined) { fields.push('sort_order=?'); values.push(parseInt(sort_order)); }
    if (is_active !== undefined)  { fields.push('is_active=?');  values.push(is_active ? 1 : 0); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Khong co gi de cap nhat.' });
    values.push(req.params.id);
    await db.execute(`UPDATE banner_slides SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ success: true, message: 'Da cap nhat!' });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// DELETE /api/banners/:id - xoa banner
router.delete('/:id', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT image_url FROM banner_slides WHERE id=?', [req.params.id]);
    if (rows[0]?.image_url) {
      const p = path.join(__dirname, '..', rows[0].image_url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    await db.execute('DELETE FROM banner_slides WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Da xoa banner.' });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

module.exports = router;
