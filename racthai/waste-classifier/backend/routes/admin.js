/**
 * admin.js - ROUTE QUAN TRI ADMIN
 * Tat ca endpoint deu yeu cau dang nhap va quyen admin
 * Chuc nang: thong ke, quan ly user, xem anh, thong ke API
 */
const express = require('express');
const router  = express.Router();
const { yeuCauDangNhap, yeuCauAdmin } = require('../middleware/auth');
const db = require('../config/database');

// Ap dung xac thuc admin cho tat ca route trong file nay
router.use(yeuCauDangNhap, yeuCauAdmin);

// ============================================
// GET /api/admin/stats - THONG KE TONG QUAN
// ============================================
router.get('/stats', async (req, res) => {
  try {
    // Lay nhieu thong ke cung luc (chay song song)
    const [
      [tongUser], [tongPhanLoai], [tongChat],
      [apiHomNay], [phanLoaiHomNay], [daCache],
      thongKeNgay, tatCaKetQua
    ] = await Promise.all([
      db.execute('SELECT COUNT(*) as so FROM users WHERE role = "user"'),
      db.execute('SELECT COUNT(*) as so FROM classifications'),
      db.execute('SELECT COUNT(*) as so FROM chat_history'),
      db.execute('SELECT COUNT(*) as so FROM api_usage WHERE DATE(created_at) = CURDATE()'),
      db.execute('SELECT COUNT(*) as so FROM classifications WHERE DATE(created_at) = CURDATE()'),
      db.execute('SELECT COUNT(*) as so FROM api_usage WHERE status = "cached"'),
      db.execute(`SELECT DATE(created_at) as ngay, COUNT(*) as so
                  FROM classifications
                  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                  GROUP BY DATE(created_at) ORDER BY ngay ASC`),
      db.execute('SELECT result_json FROM classifications WHERE status = "completed" AND result_json IS NOT NULL LIMIT 200')
    ]);

    // Dem loai rac tu ket qua phan loai
    const thongKeLoaiRac = {};
    tatCaKetQua[0].forEach(row => {
      try {
        const kq = JSON.parse(row.result_json);
        kq.detections?.forEach(d => {
          thongKeLoaiRac[d.category] = (thongKeLoaiRac[d.category] || 0) + 1;
        });
      } catch {}
    });

    res.json({
      success: true,
      stats: {
        tongUser:          tongUser[0].so,
        tongPhanLoai:      tongPhanLoai[0].so,
        tongChat:          tongChat[0].so,
        apiHomNay:         apiHomNay[0].so,
        phanLoaiHomNay:    phanLoaiHomNay[0].so,
        soLanDungCache:    daCache[0].so,
        thongKeNgay:       thongKeNgay[0],
        thongKeLoaiRac
      }
    });
  } catch (loi) {
    console.error('[LOI THONG KE]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/admin/users - DANH SACH NGUOI DUNG
// ============================================
router.get('/users', async (req, res) => {
  try {
    const trang   = parseInt(req.query.page)   || 1;
    const soLuong = parseInt(req.query.limit)  || 20;
    const timKiem = req.query.search || '';
    const buQua   = (trang - 1) * soLuong;

    const dieuKien = timKiem ? 'WHERE username LIKE ? OR email LIKE ?' : '';
    const params   = timKiem ? [`%${timKiem}%`, `%${timKiem}%`] : [];

    const [users] = await db.execute(
      `SELECT id, username, email, role, is_active, created_at, last_login
       FROM users ${dieuKien}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, soLuong, buQua]
    );

    const [[{ tong }]] = await db.execute(
      `SELECT COUNT(*) as tong FROM users ${dieuKien}`, params
    );

    res.json({
      success: true,
      users,
      pagination: { page: trang, limit: soLuong, total: tong, totalPages: Math.ceil(tong / soLuong) }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// PUT /api/admin/users/:id - CAP NHAT USER
// ============================================
router.put('/users/:id', async (req, res) => {
  try {
    const { role, is_active } = req.body;
    const userId = parseInt(req.params.id);

    if (userId === req.user.id)
      return res.status(400).json({ success: false, message: 'Khong the tu sua tai khoan cua minh.' });

    const capNhat = [];
    const giaTri  = [];
    if (role !== undefined && ['admin', 'user'].includes(role)) { capNhat.push('role = ?'); giaTri.push(role); }
    if (is_active !== undefined) { capNhat.push('is_active = ?'); giaTri.push(is_active ? 1 : 0); }

    if (!capNhat.length)
      return res.status(400).json({ success: false, message: 'Khong co gi de cap nhat.' });

    await db.execute(`UPDATE users SET ${capNhat.join(', ')} WHERE id = ?`, [...giaTri, userId]);
    res.json({ success: true, message: 'Cap nhat thanh cong.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// DELETE /api/admin/users/:id - XOA USER
// ============================================
router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: 'Khong the xoa tai khoan cua minh.' });

    await db.execute('DELETE FROM users WHERE id = ? AND role != "admin"', [req.params.id]);
    res.json({ success: true, message: 'Da xoa nguoi dung.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/admin/images - DANH SACH ANH DA TAI
// ============================================
router.get('/images', async (req, res) => {
  try {
    const trang   = parseInt(req.query.page)  || 1;
    const soLuong = parseInt(req.query.limit) || 12;
    const buQua   = (trang - 1) * soLuong;

    const [rows] = await db.execute(
      `SELECT c.id, c.image_path, c.original_filename, c.status, c.created_at,
              u.username, u.email
       FROM classifications c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [soLuong, buQua]
    );

    const [[{ tong }]] = await db.execute('SELECT COUNT(*) as tong FROM classifications');

    res.json({
      success: true,
      images: rows,
      pagination: { page: trang, limit: soLuong, total: tong, totalPages: Math.ceil(tong / soLuong) }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/admin/api-usage - THONG KE DUNG API
// ============================================
router.get('/api-usage', async (req, res) => {
  try {
    const [theoEndpoint, theoNgay, topUser] = await Promise.all([
      db.execute(`SELECT endpoint, status, COUNT(*) as so_lan, SUM(tokens_used) as tong_token
                  FROM api_usage GROUP BY endpoint, status`),
      db.execute(`SELECT DATE(created_at) as ngay, endpoint, COUNT(*) as so_lan
                  FROM api_usage
                  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                  GROUP BY DATE(created_at), endpoint ORDER BY ngay ASC`),
      db.execute(`SELECT u.username, u.email, COUNT(a.id) as so_lan_goi, SUM(a.tokens_used) as tong_token
                  FROM api_usage a JOIN users u ON a.user_id = u.id
                  GROUP BY a.user_id ORDER BY so_lan_goi DESC LIMIT 10`)
    ]);

    res.json({
      success: true,
      usage: {
        theoEndpoint: theoEndpoint[0],
        theoNgay:     theoNgay[0],
        topUser:      topUser[0]
      }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/admin/chat-history - LICH SU CHAT TOAN BO
// ============================================
router.get('/chat-history', async (req, res) => {
  try {
    const trang   = parseInt(req.query.page)  || 1;
    const soLuong = parseInt(req.query.limit) || 20;
    const buQua   = (trang - 1) * soLuong;

    const [rows] = await db.execute(
      `SELECT ch.id, ch.session_id, ch.message, ch.response, ch.tokens_used, ch.created_at,
              u.username, u.email
       FROM chat_history ch
       LEFT JOIN users u ON ch.user_id = u.id
       ORDER BY ch.created_at DESC LIMIT ? OFFSET ?`,
      [soLuong, buQua]
    );
    const [[{ tong }]] = await db.execute('SELECT COUNT(*) as tong FROM chat_history');

    res.json({
      success: true,
      chats: rows,
      pagination: { page: trang, limit: soLuong, total: tong, totalPages: Math.ceil(tong / soLuong) }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/admin/staff-chats - DANH SACH STAFF CHATS (phan trang)
// ============================================
router.get('/staff-chats', async (req, res) => {
  try {
    const page     = parseInt(req.query.page)     || 1;
    const limit    = parseInt(req.query.limit)    || 20;
    const status   = req.query.status   || '';
    const search   = req.query.search   || '';
    const staffId  = req.query.staff_id || '';
    const offset   = (page - 1) * limit;

    const where  = [];
    const params = [];
    if (status)  { where.push('c.status=?');                                     params.push(status); }
    if (search)  { where.push('(c.guest_name LIKE ? OR c.guest_email LIKE ?)');  params.push(`%${search}%`, `%${search}%`); }
    if (staffId) { where.push('c.staff_id=?');                                   params.push(staffId); }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [chats] = await db.execute(
      `SELECT c.*,
              cu.username as user_name,  cu.email as user_email,
              su.username as staff_name, su.email as staff_email
       FROM staff_chats c
       LEFT JOIN users cu ON c.user_id  = cu.id
       LEFT JOIN users su ON c.staff_id = su.id
       ${whereStr}
       ORDER BY c.last_msg_at DESC, c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) as total FROM staff_chats c ${whereStr}`,
      params
    );

    res.json({
      success: true,
      chats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    console.error('[ADMIN STAFF-CHATS]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// DELETE /api/admin/staff-chats/:chatId - XOA CUOC CHAT
// ============================================
router.delete('/staff-chats/:chatId', async (req, res) => {
  try {
    await db.execute('DELETE FROM staff_chats WHERE id=?', [req.params.chatId]);
    res.json({ success: true, message: 'Đã xóa cuộc chat.' });
  } catch (e) {
    console.error('[ADMIN DELETE STAFF-CHAT]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// GET /api/admin/staff-chats/:chatId/messages - TIN NHAN TRONG CUOC CHAT
// ============================================
router.get('/staff-chats/:chatId/messages', async (req, res) => {
  try {
    const [messages] = await db.execute(
      `SELECT m.*, u.username, u.avatar, u.full_name
       FROM staff_messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id=?
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.params.chatId]
    );
    res.json({ success: true, messages });
  } catch (e) {
    console.error('[ADMIN STAFF-CHAT MESSAGES]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;

// ============================================
// FEEDBACK MANAGEMENT
// ============================================

// GET /api/admin/feedbacks - danh sach phan hoi
router.get('/feedbacks', async (req, res) => {
  try {
    const trang   = parseInt(req.query.page)   || 1;
    const soLuong = parseInt(req.query.limit)  || 15;
    const status  = req.query.status || '';
    const buQua   = (trang - 1) * soLuong;

    const where  = status ? 'WHERE f.status = ?' : '';
    const params = status ? [status] : [];

    const [rows] = await db.execute(
      `SELECT f.id, f.name, f.email, f.subject, f.message, f.status,
              f.admin_reply, f.replied_at, f.created_at,
              u.username, u.avatar
       FROM feedbacks f
       LEFT JOIN users u ON f.user_id = u.id
       ${where}
       ORDER BY
         CASE f.status WHEN 'pending' THEN 0 WHEN 'read' THEN 1 ELSE 2 END,
         f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, soLuong, buQua]
    );

    const [[{ tong }]] = await db.execute(
      `SELECT COUNT(*) as tong FROM feedbacks f ${where}`, params
    );
    const [[{ chuaDoc }]] = await db.execute(
      "SELECT COUNT(*) as chuaDoc FROM feedbacks WHERE status = 'pending'"
    );

    res.json({
      success: true,
      feedbacks: rows,
      pagination: { page: trang, limit: soLuong, total: tong, totalPages: Math.ceil(tong / soLuong) },
      chuaDoc
    });
  } catch (loi) {
    console.error('[LOI FEEDBACKS]', loi);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/admin/feedbacks/:id - chi tiet
router.get('/feedbacks/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT f.*, u.username, u.avatar, u.email as user_email
       FROM feedbacks f LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Khong tim thay.' });

    // Danh dau da doc neu con pending
    if (rows[0].status === 'pending') {
      await db.execute("UPDATE feedbacks SET status = 'read' WHERE id = ?", [req.params.id]);
      rows[0].status = 'read';
    }
    res.json({ success: true, feedback: rows[0] });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/admin/feedbacks/:id/reply - tra loi
router.put('/feedbacks/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim())
      return res.status(400).json({ success: false, message: 'Noi dung tra loi khong duoc trong.' });

    const [kq] = await db.execute(
      `UPDATE feedbacks
       SET admin_reply = ?, status = 'replied', replied_at = NOW()
       WHERE id = ?`,
      [reply.trim(), req.params.id]
    );
    if (!kq.affectedRows)
      return res.status(404).json({ success: false, message: 'Khong tim thay.' });

    res.json({ success: true, message: 'Da gui tra loi thanh cong.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// DELETE /api/admin/feedbacks/:id - xoa
router.delete('/feedbacks/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM feedbacks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Da xoa.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ============================================
// STAFF MANAGEMENT (chi admin)
// ============================================

// GET /api/admin/staff - danh sach nhan vien
router.get('/staff', async (req, res) => {
  try {
    const [staff] = await db.execute(
      `SELECT id, username, email, full_name, phone, avatar, is_active, created_at, last_login
       FROM users WHERE role='staff' ORDER BY created_at DESC`
    );
    res.json({ success: true, staff });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// POST /api/admin/staff - tao tai khoan nhan vien
router.post('/staff', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { username, email, password, full_name, phone } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Thieu thong tin.' });

    const [dup] = await db.execute('SELECT id FROM users WHERE email=? OR username=?', [email, username]);
    if (dup.length) return res.status(409).json({ success: false, message: 'Email hoac username da ton tai.' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.execute(
      'INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES (?,?,?,?,?,?)',
      [username, email, hash, 'staff', full_name||null, phone||null]
    );
    res.json({ success: true, message: 'Da tao tai khoan nhan vien!', id: r.insertId });
  } catch (e) {
    console.error('[CREATE STAFF]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/admin/staff/:id - cap nhat nhan vien (role, is_active, info)
router.put('/staff/:id', async (req, res) => {
  try {
    const { role, is_active, full_name, phone } = req.body;
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: 'Khong the sua chinh minh.' });

    const fields = [], values = [];
    if (role !== undefined && ['staff','user'].includes(role)) { fields.push('role=?'); values.push(role); }
    if (is_active !== undefined) { fields.push('is_active=?'); values.push(is_active ? 1 : 0); }
    if (full_name !== undefined) { fields.push('full_name=?'); values.push(full_name); }
    if (phone !== undefined)     { fields.push('phone=?');     values.push(phone); }

    if (!fields.length) return res.status(400).json({ success: false, message: 'Khong co gi de cap nhat.' });
    values.push(req.params.id);
    await db.execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ success: true, message: 'Da cap nhat nhan vien.' });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});

// GET /api/admin/chat-stats - thong ke chat
router.get('/chat-stats', async (req, res) => {
  try {
    const [[stats]] = await db.execute(`
      SELECT
        COUNT(*) as total_chats,
        SUM(status='waiting') as waiting,
        SUM(status='active')  as active,
        SUM(status='closed')  as closed
      FROM staff_chats
    `);
    const [[msgStats]] = await db.execute(`
      SELECT COUNT(*) as total_messages,
             SUM(is_read=0) as unread
      FROM staff_messages
    `);
    res.json({ success: true, stats: { ...stats, ...msgStats } });
  } catch { res.status(500).json({ success: false, message: 'Loi server.' }); }
});
