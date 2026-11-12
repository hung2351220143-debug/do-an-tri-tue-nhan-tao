/**
 * ratings.js - ROUTE DANH GIA
 * Public : summary, danh sach co comment
 * User   : gui, sua, xoa danh gia cua minh; xem lich su
 * Admin  : GET all, PUT sua, DELETE, PUT reply
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { tuyChonDangNhap, yeuCauDangNhap, yeuCauAdmin } = require('../middleware/auth');

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────

// GET /api/ratings/summary
router.get('/summary', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const [[tongKet], [phanBo], [reviews]] = await Promise.all([
      db.execute(`
        SELECT COUNT(*) AS tong, ROUND(AVG(stars),1) AS trung_binh,
               SUM(stars=5) AS nam_sao, SUM(stars=4) AS bon_sao,
               SUM(stars=3) AS ba_sao,  SUM(stars=2) AS hai_sao,
               SUM(stars=1) AS mot_sao
        FROM ratings`),
      db.execute(`
        SELECT stars, COUNT(*) AS so_luong FROM ratings
        GROUP BY stars ORDER BY stars DESC`),
      db.execute(`
        SELECT r.id, r.stars, r.comment, r.admin_reply, r.replied_at, r.created_at,
               u.username, u.full_name, u.avatar,
               c.image_path, c.original_filename
        FROM ratings r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN classifications c ON r.classification_id = c.id
        WHERE r.comment IS NOT NULL AND r.comment != ''
        ORDER BY r.created_at DESC LIMIT ?`, [limit])
    ]);
    const tk = tongKet[0];
    res.json({
      success: true,
      summary: {
        tong: tk.tong||0, trung_binh: tk.trung_binh||0,
        nam_sao: tk.nam_sao||0, bon_sao: tk.bon_sao||0,
        ba_sao: tk.ba_sao||0,   hai_sao: tk.hai_sao||0,
        mot_sao: tk.mot_sao||0, phan_bo: phanBo
      },
      reviews: reviews
    });
  } catch (e) {
    console.error('[RATING SUMMARY]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/ratings/chart - bieu do danh gia 30 ngay + phan bo sao + binh luan gan day (public)
router.get('/chart', async (req, res) => {
  try {
    const [byDay] = await db.execute(`SELECT DATE(created_at) as date, AVG(stars) as avg_stars, COUNT(*) as count FROM ratings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC`)
    const [byStar] = await db.execute(`SELECT stars, COUNT(*) as count FROM ratings GROUP BY stars ORDER BY stars DESC`)
    const [recent] = await db.execute(`SELECT r.stars, r.comment, r.created_at, u.username, u.full_name, u.avatar FROM ratings r LEFT JOIN users u ON r.user_id=u.id WHERE r.comment IS NOT NULL AND r.comment != '' ORDER BY r.created_at DESC LIMIT 5`)
    res.json({ success: true, byDay, byStar, recent })
  } catch(e) { res.status(500).json({ success: false, message: 'Loi server.' }) }
})

// ─────────────────────────────────────────────
// USER – gửi / sửa đánh giá
// ─────────────────────────────────────────────

// POST /api/ratings
router.post('/', tuyChonDangNhap, async (req, res) => {
  try {
    const { classification_id, stars, comment } = req.body;
    if (!classification_id || !stars || stars < 1 || stars > 5)
      return res.status(400).json({ success: false, message: 'Du lieu khong hop le.' });
    const userId = req.user?.id || null;
    const [kq] = await db.execute(
      `INSERT INTO ratings (classification_id, user_id, stars, comment)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE stars=VALUES(stars), comment=VALUES(comment), admin_reply=NULL, replied_at=NULL`,
      [classification_id, userId, parseInt(stars), comment?.trim()||null]
    );
    res.json({ success: true, message: 'Cam on ban da danh gia!', id: kq.insertId||null });
  } catch (e) {
    console.error('[POST RATING]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/ratings/my – lịch sử đánh giá của user
router.get('/my', yeuCauDangNhap, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.id, r.stars, r.comment, r.admin_reply, r.replied_at, r.created_at,
             c.id AS classification_id, c.image_path, c.original_filename,
             c.result_json
      FROM ratings r
      LEFT JOIN classifications c ON r.classification_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC`, [req.user.id]);
    res.json({ success: true, ratings: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/ratings/my/:classificationId – kiểm tra đã đánh giá chưa
router.get('/my/:classificationId', tuyChonDangNhap, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) return res.json({ success: true, rating: null });
    const [rows] = await db.execute(
      'SELECT id, stars, comment, admin_reply, replied_at FROM ratings WHERE classification_id=? AND user_id=?',
      [req.params.classificationId, userId]
    );
    res.json({ success: true, rating: rows[0]||null });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/ratings/:id – user sửa đánh giá của mình
router.put('/:id', yeuCauDangNhap, async (req, res) => {
  try {
    const { stars, comment } = req.body;
    if (stars && (stars < 1 || stars > 5))
      return res.status(400).json({ success: false, message: 'Sao khong hop le.' });
    const fields = [], values = [];
    if (stars)             { fields.push('stars=?');   values.push(parseInt(stars)); }
    if (comment !== undefined) { fields.push('comment=?'); values.push(comment?.trim()||null); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Khong co gi de cap nhat.' });
    values.push(req.params.id, req.user.id);
    const [kq] = await db.execute(
      `UPDATE ratings SET ${fields.join(',')} WHERE id=? AND user_id=?`, values
    );
    if (!kq.affectedRows) return res.status(404).json({ success: false, message: 'Khong tim thay.' });
    res.json({ success: true, message: 'Da cap nhat!' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// DELETE /api/ratings/:id – user xóa đánh giá của mình
router.delete('/:id', yeuCauDangNhap, async (req, res) => {
  try {
    // Admin xóa được tất cả, user chỉ xóa của mình
    const isAdmin = req.user.role === 'admin';
    const cond    = isAdmin ? 'WHERE id=?' : 'WHERE id=? AND user_id=?';
    const params  = isAdmin ? [req.params.id] : [req.params.id, req.user.id];
    const [kq] = await db.execute(`DELETE FROM ratings ${cond}`, params);
    if (!kq.affectedRows) return res.status(404).json({ success: false, message: 'Khong tim thay.' });
    res.json({ success: true, message: 'Da xoa.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

// GET /api/ratings/admin/all – danh sách tất cả (admin)
router.get('/admin/all', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const trang   = parseInt(req.query.page)  || 1;
    const soLuong = parseInt(req.query.limit) || 15;
    const buQua   = (trang-1)*soLuong;
    const stars   = req.query.stars ? parseInt(req.query.stars) : null;
    const where   = stars ? 'WHERE r.stars=?' : '';
    const params  = stars ? [stars] : [];

    const [rows] = await db.execute(`
      SELECT r.id, r.stars, r.comment, r.admin_reply, r.replied_at, r.created_at,
             u.username, u.full_name, u.avatar, u.email,
             c.id AS classification_id, c.image_path, c.original_filename
      FROM ratings r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN classifications c ON r.classification_id = c.id
      ${where}
      ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, soLuong, buQua]
    );
    const [[{tong}]] = await db.execute(
      `SELECT COUNT(*) as tong FROM ratings r ${where}`, params
    );
    res.json({
      success: true, ratings: rows,
      pagination: { page: trang, limit: soLuong, total: tong, totalPages: Math.ceil(tong/soLuong) }
    });
  } catch (e) {
    console.error('[ADMIN RATINGS]', e);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/ratings/admin/:id – admin sửa bất kỳ đánh giá
router.put('/admin/:id', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const { stars, comment } = req.body;
    const fields = [], values = [];
    if (stars !== undefined)   { fields.push('stars=?');   values.push(parseInt(stars)); }
    if (comment !== undefined) { fields.push('comment=?'); values.push(comment?.trim()||null); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Khong co gi de cap nhat.' });
    values.push(req.params.id);
    const [kq] = await db.execute(`UPDATE ratings SET ${fields.join(',')} WHERE id=?`, values);
    if (!kq.affectedRows) return res.status(404).json({ success: false, message: 'Khong tim thay.' });
    res.json({ success: true, message: 'Admin da cap nhat danh gia.' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/ratings/admin/:id/reply – admin trả lời đánh giá
router.put('/admin/:id/reply', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim())
      return res.status(400).json({ success: false, message: 'Noi dung khong duoc trong.' });
    const [kq] = await db.execute(
      'UPDATE ratings SET admin_reply=?, replied_at=NOW() WHERE id=?',
      [reply.trim(), req.params.id]
    );
    if (!kq.affectedRows) return res.status(404).json({ success: false, message: 'Khong tim thay.' });
    res.json({ success: true, message: 'Da gui phan hoi!' });
  } catch {
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
