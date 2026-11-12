/**
 * chat.js - ROUTE CHAT VOI AI
 * Nguoi dung gui tin nhan → Gemini tra loi → luu lich su (neu da dang nhap)
 */
const express  = require('express');
const router   = express.Router();
const { chatVoiAI }        = require('../utils/gemini');
const { tuyChonDangNhap }  = require('../middleware/auth');
const db  = require('../config/database');

// Tao session ID don gian
const taoSessionId = () => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// ============================================
// POST /api/chat - GUI TIN NHAN
// ============================================
router.post('/', tuyChonDangNhap, async (req, res) => {
  try {
    const { message, sessionId, history = [] } = req.body;

    if (!message?.trim())
      return res.status(400).json({ success: false, message: 'Vui long nhap tin nhan.' });
    if (message.length > 1000)
      return res.status(400).json({ success: false, message: 'Tin nhan qua dai (toi da 1000 ky tu).' });

    const userId        = req.user?.id || null;
    const idPhienHienTai = sessionId || taoSessionId();

    // Goi AI (chi truyen 10 tin nhan gan nhat de tiet kiem token)
    const lichSuGanNhat = history.slice(-10);
    const phanHoi = await chatVoiAI(message.trim(), lichSuGanNhat);

    // Luu lich su chat neu da dang nhap
    if (userId) {
      await db.execute(
        'INSERT INTO chat_history (user_id, session_id, message, response, tokens_used) VALUES (?, ?, ?, ?, ?)',
        [userId, idPhienHienTai, message.trim(), phanHoi.phanHoi, phanHoi.tokens || 0]
      );
    }

    // Ghi log su dung API
    await db.execute(
      'INSERT INTO api_usage (endpoint, user_id, tokens_used, status, ip_address) VALUES (?, ?, ?, ?, ?)',
      ['chat', userId, phanHoi.tokens || 200, 'success', req.ip]
    ).catch(() => {});

    res.json({
      success:   true,
      response:  phanHoi.phanHoi,
      sessionId: idPhienHienTai,
      tokens:    phanHoi.tokens
    });

  } catch (loi) {
    console.error('[LOI CHAT]', loi.message);
    await db.execute(
      'INSERT INTO api_usage (endpoint, user_id, tokens_used, status, ip_address) VALUES (?, ?, ?, ?, ?)',
      ['chat', req.user?.id || null, 0, 'error', req.ip]
    ).catch(() => {});

    res.status(500).json({ success: false, message: loi.message || 'Khong the ket noi AI. Vui long thu lai.' });
  }
});

// ============================================
// GET /api/chat/sessions - DANH SACH PHIEN CHAT
// (can dang nhap)
// ============================================
router.get('/sessions', tuyChonDangNhap, async (req, res) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Can dang nhap de xem lich su.' });

  try {
    const [phien] = await db.execute(
      `SELECT session_id,
              MIN(created_at) as bat_dau,
              MAX(created_at) as tin_nhan_cuoi,
              COUNT(*)        as so_tin_nhan,
              LEFT(message, 60) as tin_nhan_dau
       FROM chat_history
       WHERE user_id = ?
       GROUP BY session_id
       ORDER BY tin_nhan_cuoi DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ success: true, sessions: phien });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
