/**
 * classify.js - ROUTE PHAN LOAI RAC TU ANH
 * Nhan anh tu nguoi dung → goi Gemini → tra ve ket qua phan loai
 * Ho tro ca khach (chua dang nhap) va nguoi dung da dang nhap
 */
const express  = require('express');
const router   = express.Router();
const { phanLoaiRacTuAnh, tinhHashAnh } = require('../utils/gemini');
const { tuyChonDangNhap }               = require('../middleware/auth');
const upload   = require('../middleware/upload');
const db       = require('../config/database');

// ============================================
// POST /api/classify - PHAN LOAI ANH
// ============================================
router.post('/', tuyChonDangNhap, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui long chon anh de phan loai.' });
  }

  const duongDanAnh = req.file.path;
  const urlAnh      = `/uploads/${req.file.filename}`;
  const userId      = req.user?.id || null;

  try {
    const hashAnh = tinhHashAnh(duongDanAnh);

    // Kiem tra cache trong DB: anh nay da phan tich chua?
    if (hashAnh) {
      const [cache] = await db.execute(
        'SELECT id, result_json FROM classifications WHERE image_hash = ? AND status = "completed" LIMIT 1',
        [hashAnh]
      );

      if (cache.length && cache[0].result_json) {
        // Co cache → luu ban ghi moi nhung dung ket qua cu
        const [kq] = await db.execute(
          'INSERT INTO classifications (user_id, image_path, image_hash, original_filename, result_json, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, urlAnh, hashAnh, req.file.originalname, cache[0].result_json, 'completed']
        );
        await ghiApiUsage('classify', userId, 0, 'cached', req.ip);

        return res.json({
          success: true,
          classificationId: kq.insertId,
          imageUrl: urlAnh,
          result: { ...JSON.parse(cache[0].result_json), cached: true },
          message: 'Phan loai thanh cong! (tu cache ⚡)'
        });
      }
    }

    // Goi Gemini AI phan tich
    const ketQua = await phanLoaiRacTuAnh(duongDanAnh, hashAnh);

    const [kq] = await db.execute(
      'INSERT INTO classifications (user_id, image_path, image_hash, original_filename, result_json, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, urlAnh, hashAnh, req.file.originalname, JSON.stringify(ketQua), 'completed']
    );
    await ghiApiUsage('classify', userId, 500, 'success', req.ip);

    res.json({
      success: true,
      classificationId: kq.insertId,
      imageUrl: urlAnh,
      result: ketQua,
      message: 'Phan loai thanh cong!'
    });

  } catch (loi) {
    console.error('[LOI PHAN LOAI]', loi.message);
    await ghiApiUsage('classify', userId, 0, 'error', req.ip).catch(() => {});
    await db.execute(
      'INSERT INTO classifications (user_id, image_path, image_hash, original_filename, status) VALUES (?, ?, ?, ?, ?)',
      [userId, urlAnh, null, req.file?.originalname, 'failed']
    ).catch(() => {});

    res.status(500).json({
      success: false,
      message: loi.message || 'Khong the phan tich anh. Vui long thu lai.',
      imageUrl: urlAnh
    });
  }
});

// ============================================
// GET /api/classify/:id - LAY KET QUA THEO ID
// ============================================
router.get('/:id', tuyChonDangNhap, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, u.username FROM classifications c
       LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Khong tim thay ket qua.' });

    const item = rows[0];
    res.json({
      success: true,
      classification: { ...item, result_json: item.result_json ? JSON.parse(item.result_json) : null }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// Ham tien ich ghi log su dung API
async function ghiApiUsage(endpoint, userId, tokens, trangThai, ip) {
  await db.execute(
    'INSERT INTO api_usage (endpoint, user_id, tokens_used, status, ip_address) VALUES (?, ?, ?, ?, ?)',
    [endpoint, userId, tokens, trangThai, ip]
  );
}

module.exports = router;
