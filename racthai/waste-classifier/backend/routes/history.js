/**
 * history.js - ROUTE LICH SU SU DUNG
 * Xem lai lich su phan loai anh va lich su chat (can dang nhap)
 */
const express = require('express');
const router  = express.Router();
const { yeuCauDangNhap } = require('../middleware/auth');
const db = require('../config/database');

// ============================================
// GET /api/history/classifications - LICH SU PHAN LOAI
// ============================================
router.get('/classifications', yeuCauDangNhap, async (req, res) => {
  try {
    const trang   = parseInt(req.query.page)  || 1;
    const soLuong = parseInt(req.query.limit) || 10;
    const buQua   = (trang - 1) * soLuong;

    const [rows] = await db.execute(
      `SELECT id, image_path, original_filename, result_json, status, created_at
       FROM classifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, soLuong, buQua]
    );

    const [[{ tong }]] = await db.execute(
      'SELECT COUNT(*) as tong FROM classifications WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      classifications: rows.map(r => ({
        ...r,
        result_json: r.result_json ? JSON.parse(r.result_json) : null
      })),
      pagination: { page: trang, limit: soLuong, total: tong, totalPages: Math.ceil(tong / soLuong) }
    });
  } catch (loi) {
    console.error('[LOI LICH SU PHAN LOAI]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/history/chats - LICH SU CHAT
// ?sessionId=xxx → lay tat ca tin nhan trong phien
// (khong co) → lay danh sach phien chat
// ============================================
router.get('/chats', yeuCauDangNhap, async (req, res) => {
  try {
    const { sessionId } = req.query;
    const trang   = parseInt(req.query.page)  || 1;
    const soLuong = parseInt(req.query.limit) || 20;
    const buQua   = (trang - 1) * soLuong;

    if (sessionId) {
      // Lay tin nhan trong mot phien cu the
      const [rows] = await db.execute(
        `SELECT id, session_id, message, response, tokens_used, created_at
         FROM chat_history
         WHERE user_id = ? AND session_id = ?
         ORDER BY created_at ASC`,
        [req.user.id, sessionId]
      );
      return res.json({ success: true, chats: rows });
    }

    // Lay danh sach phien chat (nhom theo session_id)
    const [rows] = await db.execute(
      `SELECT session_id,
              MIN(created_at) as bat_dau,
              MAX(created_at) as tin_nhan_cuoi,
              COUNT(*)        as so_tin_nhan,
              (SELECT message FROM chat_history c2
               WHERE c2.session_id = c.session_id AND c2.user_id = ?
               ORDER BY created_at ASC LIMIT 1) as tin_nhan_dau
       FROM chat_history c
       WHERE user_id = ?
       GROUP BY session_id
       ORDER BY tin_nhan_cuoi DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, req.user.id, soLuong, buQua]
    );

    res.json({ success: true, chats: rows });
  } catch (loi) {
    console.error('[LOI LICH SU CHAT]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// DELETE /api/history/classifications/:id - XOA PHAN LOAI
// ============================================
router.delete('/classifications/:id', yeuCauDangNhap, async (req, res) => {
  try {
    const [kq] = await db.execute(
      'DELETE FROM classifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!kq.affectedRows)
      return res.status(404).json({ success: false, message: 'Khong tim thay ban ghi.' });
    res.json({ success: true, message: 'Da xoa.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// DELETE /api/history/chats/:sessionId - XOA PHIEN CHAT
// ============================================
router.delete('/chats/:sessionId', yeuCauDangNhap, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM chat_history WHERE session_id = ? AND user_id = ?',
      [req.params.sessionId, req.user.id]
    );
    res.json({ success: true, message: 'Da xoa phien chat.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
