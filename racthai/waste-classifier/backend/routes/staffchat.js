/**
 * staffchat.js - API QUAN LY CHAT KHACH-NHAN VIEN
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/database');
const { yeuCauDangNhap, tuyChonDangNhap } = require('../middleware/auth');

// Upload file trong chat
const chatDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });

const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, chatDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `chat-${Date.now()}-${Math.round(Math.random()*1e5)}${ext}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/','video/','application/pdf','text/','application/zip',
                'application/msword','application/vnd.'].some(t => file.mimetype.startsWith(t));
    ok ? cb(null, true) : cb(new Error('Loai file khong duoc ho tro'));
  }
});

// GET /api/staff-chat/my - lay cuoc hoi thoai cua user dang nhap
router.get('/my', tuyChonDangNhap, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) return res.json({ success: true, chats: [] });
    const [chats] = await db.execute(
      `SELECT c.*, u.username as staff_name, u.avatar as staff_avatar
       FROM staff_chats c LEFT JOIN users u ON c.staff_id = u.id
       WHERE c.user_id=? ORDER BY c.last_msg_at DESC, c.created_at DESC`,
      [userId]
    );
    res.json({ success: true, chats });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// GET /api/staff-chat/online-staff - danh sach nhan vien/admin online de khach chon
router.get('/online-staff', tuyChonDangNhap, async (req, res) => {
  try {
    const { isOnline } = require('../socket/onlineStaff');
    const [rows] = await db.execute(
      `SELECT id, username, full_name, avatar
       FROM users
       WHERE role IN ('staff','admin') AND is_active=1
       ORDER BY full_name, username`
    );
    const staff = rows.map(r => ({
      id:        r.id,
      username:  r.username,
      full_name: r.full_name,
      avatar:    r.avatar,
      online:    isOnline(r.id)
    }));
    res.json({ success: true, staff });
  } catch (e) {
    console.error('[ONLINE STAFF]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/staff-chat/:chatId/messages - lich su tin nhan
router.get('/:chatId/messages', tuyChonDangNhap, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;
    const search = req.query.search || '';
    let sql    = `SELECT m.*, u.username, u.avatar, u.full_name
                  FROM staff_messages m LEFT JOIN users u ON m.sender_id=u.id
                  WHERE m.chat_id=?`;
    const params = [req.params.chatId];
    if (before) { sql += ' AND m.id<?'; params.push(before); }
    if (search) { sql += ' AND m.message LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);
    const [messages] = await db.execute(sql, params);
    res.json({ success: true, messages: messages.reverse() });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// DELETE /api/staff-chat/:chatId - soft-delete (set status=closed)
router.delete('/:chatId', tuyChonDangNhap, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    await db.execute(
      `UPDATE staff_chats SET status='closed' WHERE id=? AND (user_id=? OR ? IS NULL)`,
      [req.params.chatId, userId, userId]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// DELETE /api/staff-chat/:chatId/messages - hard-delete non-system messages
router.delete('/:chatId/messages', yeuCauDangNhap, async (req, res) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;
    // Only chat owner or admin may delete message history
    const [[chat]] = await db.execute('SELECT user_id FROM staff_chats WHERE id=?', [req.params.chatId]);
    if (!chat) return res.status(404).json({ success: false, message: 'Khong tim thay cuoc chat.' });
    if (role !== 'admin' && chat.user_id !== userId)
      return res.status(403).json({ success: false, message: 'Khong co quyen.' });
    await db.execute(
      `DELETE FROM staff_messages WHERE chat_id=? AND sender_type != 'system'`,
      [req.params.chatId]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// GET /api/staff-chat/staff/inbox - staff xem tat ca cuoc hoi thoai
router.get('/staff/inbox', yeuCauDangNhap, async (req, res) => {
  try {
    if (req.user.role !== 'staff' && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Khong co quyen.' });
    const status = req.query.status || '';
    const search = req.query.search || '';
    const where  = [];
    const params = [];
    if (status) { where.push('c.status=?'); params.push(status); }
    if (search)  { where.push('(c.guest_name LIKE ? OR c.guest_email LIKE ? OR u.username LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (req.user.role === 'staff') { where.push('(c.staff_id=? OR c.staff_id IS NULL)'); params.push(req.user.id); }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [chats] = await db.execute(
      `SELECT c.*, cu.username as user_name, cu.avatar as user_avatar,
              su.username as staff_name,
              (SELECT COUNT(*) FROM staff_messages sm WHERE sm.chat_id=c.id AND sm.is_read=0 AND sm.sender_type='user') as unread_count
       FROM staff_chats c
       LEFT JOIN users cu ON c.user_id=cu.id
       LEFT JOIN users su ON c.staff_id=su.id
       ${whereStr}
       ORDER BY CASE c.status WHEN 'waiting' THEN 0 WHEN 'active' THEN 1 ELSE 2 END,
                c.last_msg_at DESC LIMIT 100`,
      params
    );
    const [[{ total_unread }]] = await db.execute(
      `SELECT COUNT(*) as total_unread FROM staff_messages sm
       JOIN staff_chats c ON sm.chat_id=c.id
       WHERE sm.is_read=0 AND sm.sender_type='user'
       ${req.user.role === 'staff' ? 'AND c.staff_id='+req.user.id : ''}`
    );
    res.json({ success: true, chats, total_unread });
  } catch (e) {
    console.error('[STAFF INBOX]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/staff-chat/upload - upload file trong chat
router.post('/upload', tuyChonDangNhap, (req, res) => {
  chatUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Khong co file.' });
    res.json({
      success:  true,
      fileUrl:  `/uploads/chat/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  });
});

// POST /api/staff-chat/create - tao cuoc hoi thoai moi (REST fallback)
router.post('/create', tuyChonDangNhap, async (req, res) => {
  try {
    const { guestName, guestEmail, subject } = req.body;
    const [result] = await db.execute(
      `INSERT INTO staff_chats (user_id, guest_name, guest_email, subject, status)
       VALUES (?, ?, ?, ?, 'waiting')`,
      [req.user?.id || null, guestName || 'Khách', guestEmail || null, subject || 'Hỗ trợ chung']
    );
    res.json({ success: true, chatId: result.insertId });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

module.exports = router;
