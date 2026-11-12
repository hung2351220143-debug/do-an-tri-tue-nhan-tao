/**
 * recycle.js - TINH NANG THU MUA RAC TAI CHE (EcoScan)
 * Public:   GET  /prices, GET /shop-info, POST /orders
 * Auth:     GET  /orders/my, POST /orders/:id/upload-qr
 * Staff/Admin: GET /orders, PUT /orders/:id/confirm, POST /orders/:id/upload-proof,
 *              PUT /orders/:id/received, PUT /orders/:id/paid, PUT /orders/:id/cancel
 * Admin:    GET /prices/admin, POST /prices, PUT /prices/:id, DELETE /prices/:id,
 *           GET /settings, PUT /settings
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/database');
const { yeuCauDangNhap, tuyChonDangNhap, yeuCauAdmin } = require('../middleware/auth');

// Tao thu muc chua anh upload cho recycle neu chua co
const recycleDir = path.join(__dirname, '../uploads/recycle');
if (!fs.existsSync(recycleDir)) fs.mkdirSync(recycleDir, { recursive: true });

// Multer disk storage -> uploads/recycle (anh + pdf, toi da 20MB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recycleDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `recycle-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  ok ? cb(null, true) : cb(new Error('Chi chap nhan file anh hoac PDF'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// Tao ma don dang RC-XXXXXX
const taoMaDon = () => 'RC-' + Date.now().toString(36).toUpperCase();

// Chuyen DECIMAL sang Number de frontend de format
const toNumber = (v) => (v === null || v === undefined) ? null : Number(v);

// Parse mot don: items tu JSON string thanh mang, lam sach gia tien
const parseOrder = (row) => {
  if (!row) return null;
  let items = [];
  try { items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []); }
  catch { items = []; }
  items = items.map(it => ({ ...it, price_per_unit: toNumber(it.price_per_unit), subtotal: toNumber(it.subtotal) }));
  return { ...row, items, total_amount: toNumber(row.total_amount) };
};

// Middleware: staff hoac admin (chay SAU yeuCauDangNhap)
const yeuCauStaffOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'staff' && req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Ban khong co quyen thuc hien thao tac nay.' });
  next();
};

// ============================================
// PUBLIC / AUTH ENDPOINTS
// ============================================

// GET /api/recycle/prices - lay gia thu mua dang active (public)
router.get('/prices', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, category, name_vi, price_per_unit, unit, min_quantity, quality_note, is_active, image_url FROM recycle_prices WHERE is_active=1 ORDER BY id ASC'
    );
    const prices = rows.map(p => ({ ...p, price_per_unit: toNumber(p.price_per_unit) }));
    res.json({ success: true, prices });
  } catch (e) {
    console.error('GET /prices', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/recycle/shop-info - lay thong tin shop (public)
router.get('/shop-info', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, settings });
  } catch (e) {
    console.error('GET /shop-info', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/recycle/orders - tao don thu mua (guest hoac user da dang nhap)
router.post('/orders', tuyChonDangNhap, async (req, res) => {
  try {
    const { items, total_amount, guest_name, guest_phone, qr_image_url, bank_info } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'Vui long chon vat pham de ban.' });

    const userId    = req.user?.id || null;
    const orderCode = taoMaDon();
    const total     = Number(total_amount) || 0;

    const [r] = await db.execute(
      `INSERT INTO recycle_orders
        (order_code, user_id, guest_name, guest_phone, items, total_amount, qr_image_url, bank_info, status)
       VALUES (?,?,?,?,?,?,?,?, 'pending')`,
      [orderCode, userId, guest_name || null, guest_phone || null,
       JSON.stringify(items), total, qr_image_url || null, bank_info || null]
    );

    // Lay thong tin shop de tra ve kem don
    const [sRows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings');
    const shop_info = {};
    sRows.forEach(s => { shop_info[s.setting_key] = s.setting_value; });

    const [orderRows] = await db.execute('SELECT * FROM recycle_orders WHERE id=?', [r.insertId]);
    res.json({ success: true, message: 'Da tao don thanh cong!', order: parseOrder(orderRows[0]), shop_info });
  } catch (e) {
    console.error('POST /orders', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/recycle/orders/my - lay don cua toi (auth)
router.get('/orders/my', yeuCauDangNhap, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM recycle_orders WHERE user_id=? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, orders: rows.map(parseOrder) });
  } catch (e) {
    console.error('GET /orders/my', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/recycle/orders/:id/upload-qr - upload anh QR/thong tin TK (owner hoac staff/admin)
router.post('/orders/:id/upload-qr', yeuCauDangNhap, (req, res) => {
  upload.single('qr')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui long chon file QR.' });
    try {
      const [rows] = await db.execute('SELECT * FROM recycle_orders WHERE id=?', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ success: false, message: 'Khong tim thay don.' });
      const order = rows[0];
      const isOwner = order.user_id === req.user.id;
      const isStaffOrAdmin = req.user.role === 'staff' || req.user.role === 'admin';
      if (!isOwner && !isStaffOrAdmin)
        return res.status(403).json({ success: false, message: 'Ban khong co quyen voi don nay.' });

      const qrUrl = `/uploads/recycle/${req.file.filename}`;
      await db.execute('UPDATE recycle_orders SET qr_image_url=? WHERE id=?', [qrUrl, req.params.id]);
      res.json({ success: true, message: 'Da cap nhat anh QR.', qr_image_url: qrUrl });
    } catch (e) {
      console.error('POST upload-qr', e.message);
      res.status(500).json({ success: false, message: 'Loi server.' });
    }
  });
});

// ============================================
// STAFF / ADMIN ENDPOINTS
// ============================================

// GET /api/recycle/orders - danh sach don (staff/admin), filter status + search
router.get('/orders', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM recycle_orders WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status=?'; params.push(status); }
    if (search) {
      sql += ' AND (order_code LIKE ? OR guest_name LIKE ?)';
      const k = `%${search}%`;
      params.push(k, k);
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await db.execute(sql, params);
    res.json({ success: true, orders: rows.map(parseOrder) });
  } catch (e) {
    console.error('GET /orders', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/recycle/orders/:id/confirm - xac nhan don (staff/admin)
router.put('/orders/:id/confirm', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const { staff_note } = req.body;
    const fields = ["status='confirmed'", 'staff_id=?', 'confirmed_at=NOW()'];
    const params = [req.user.id];
    if (staff_note !== undefined) { fields.push('staff_note=?'); params.push(staff_note); }
    params.push(req.params.id);
    const [r] = await db.execute(`UPDATE recycle_orders SET ${fields.join(',')} WHERE id=?`, params);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay don.' });
    res.json({ success: true, message: 'Da xac nhan don.' });
  } catch (e) {
    console.error('PUT confirm', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/recycle/orders/:id/upload-proof - upload anh chung tu (staff/admin)
// body.type='payment' -> payment_proof_url, nguoc lai -> received_proof_url
// nhan field 'proof' hoac 'received_proof'
router.post('/orders/:id/upload-proof', yeuCauDangNhap, yeuCauStaffOrAdmin, (req, res) => {
  upload.fields([{ name: 'proof', maxCount: 1 }, { name: 'received_proof', maxCount: 1 }])(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    const file = (req.files?.proof?.[0]) || (req.files?.received_proof?.[0]);
    if (!file) return res.status(400).json({ success: false, message: 'Vui long chon file.' });
    try {
      const type = req.body.type;
      const col = type === 'payment' ? 'payment_proof_url' : 'received_proof_url';
      const url = `/uploads/recycle/${file.filename}`;
      const [r] = await db.execute(`UPDATE recycle_orders SET ${col}=? WHERE id=?`, [url, req.params.id]);
      if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay don.' });
      res.json({ success: true, message: 'Da cap nhat anh chung tu.', field: col, url });
    } catch (e) {
      console.error('POST upload-proof', e.message);
      res.status(500).json({ success: false, message: 'Loi server.' });
    }
  });
});

// PUT /api/recycle/orders/:id/received - danh dau da nhan hang (staff/admin)
router.put('/orders/:id/received', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const [r] = await db.execute("UPDATE recycle_orders SET status='received', received_at=NOW() WHERE id=?", [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay don.' });
    res.json({ success: true, message: 'Da danh dau da nhan hang.' });
  } catch (e) {
    console.error('PUT received', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/recycle/orders/:id/paid - danh dau da thanh toan (staff/admin)
router.put('/orders/:id/paid', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const [r] = await db.execute("UPDATE recycle_orders SET status='paid', paid_at=NOW() WHERE id=?", [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay don.' });
    res.json({ success: true, message: 'Da danh dau da thanh toan.' });
  } catch (e) {
    console.error('PUT paid', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/recycle/orders/:id/cancel - huy don (staff/admin)
router.put('/orders/:id/cancel', yeuCauDangNhap, yeuCauStaffOrAdmin, async (req, res) => {
  try {
    const { staff_note } = req.body;
    const [r] = staff_note !== undefined
      ? await db.execute("UPDATE recycle_orders SET status='cancelled', staff_note=? WHERE id=?", [staff_note, req.params.id])
      : await db.execute("UPDATE recycle_orders SET status='cancelled' WHERE id=?", [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay don.' });
    res.json({ success: true, message: 'Da huy don.' });
  } catch (e) {
    console.error('PUT cancel', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/recycle/orders/chart - thong ke don thu mua 30 ngay + phan bo trang thai (staff/admin)
router.get('/orders/chart', yeuCauDangNhap, (req, res, next) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') return res.status(403).json({ success: false })
  next()
}, async (req, res) => {
  try {
    const [byDay] = await db.execute(`SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as total_amount FROM recycle_orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC`)
    const [byStatus] = await db.execute(`SELECT status, COUNT(*) as count FROM recycle_orders GROUP BY status`)
    res.json({ success: true, byDay, byStatus })
  } catch(e) { res.status(500).json({ success: false, message: 'Loi server.' }) }
})

// ============================================
// ADMIN-ONLY ENDPOINTS (price CRUD + settings)
// ============================================

// GET /api/recycle/prices/admin - tat ca gia (admin, bao gom inactive)
router.get('/prices/admin', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM recycle_prices ORDER BY id ASC');
    const prices = rows.map(p => ({ ...p, price_per_unit: toNumber(p.price_per_unit) }));
    res.json({ success: true, prices });
  } catch (e) {
    console.error('GET /prices/admin', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// POST /api/recycle/prices - them gia thu mua (admin)
router.post('/prices', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const { category, name_vi, price_per_unit, unit, min_quantity, quality_note, is_active, image_url } = req.body;
    if (!category || !name_vi) return res.status(400).json({ success: false, message: 'Thieu category hoac name_vi.' });
    const price = Number(price_per_unit);
    if (isNaN(price) || price < 0) return res.status(400).json({ success: false, message: 'price_per_unit phai >= 0.' });
    try {
      const [r] = await db.execute(
        `INSERT INTO recycle_prices (category, name_vi, price_per_unit, unit, min_quantity, quality_note, is_active, image_url)
         VALUES (?,?,?,?,?,?,?,?)`,
        [category, name_vi, price, unit || 'cái', parseInt(min_quantity) || 1, quality_note || null, is_active ? 1 : 0, image_url || null]
      );
      res.json({ success: true, message: 'Da them gia thu mua.', id: r.insertId });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Category da ton tai.' });
      throw e;
    }
  } catch (e) {
    console.error('POST /prices', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/recycle/prices/:id - sua gia (admin)
router.put('/prices/:id', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const { category, name_vi, price_per_unit, unit, min_quantity, quality_note, is_active, image_url } = req.body;
    const fields = [], params = [];
    if (category !== undefined)        { fields.push('category=?');        params.push(category); }
    if (name_vi !== undefined)         { fields.push('name_vi=?');         params.push(name_vi); }
    if (price_per_unit !== undefined) {
      const price = Number(price_per_unit);
      if (isNaN(price) || price < 0) return res.status(400).json({ success: false, message: 'price_per_unit phai >= 0.' });
      fields.push('price_per_unit=?'); params.push(price);
    }
    if (unit !== undefined)            { fields.push('unit=?');            params.push(unit); }
    if (min_quantity !== undefined)    { fields.push('min_quantity=?');    params.push(parseInt(min_quantity)); }
    if (quality_note !== undefined)    { fields.push('quality_note=?');    params.push(quality_note); }
    if (is_active !== undefined)       { fields.push('is_active=?');       params.push(is_active ? 1 : 0); }
    if (image_url !== undefined)       { fields.push('image_url=?');       params.push(image_url); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Khong co gi de cap nhat.' });
    params.push(req.params.id);
    try {
      const [r] = await db.execute(`UPDATE recycle_prices SET ${fields.join(',')} WHERE id=?`, params);
      if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay gia.' });
      res.json({ success: true, message: 'Da cap nhat gia.' });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Category da ton tai.' });
      throw e;
    }
  } catch (e) {
    console.error('PUT /prices/:id', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// DELETE /api/recycle/prices/:id - xoa gia (admin)
router.delete('/prices/:id', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const [r] = await db.execute('DELETE FROM recycle_prices WHERE id=?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Khong tim thay gia.' });
    res.json({ success: true, message: 'Da xoa gia.' });
  } catch (e) {
    console.error('DELETE /prices/:id', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// GET /api/recycle/settings - lay tat ca shop settings (admin)
router.get('/settings', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, setting_key, setting_value, description FROM shop_settings ORDER BY id ASC');
    res.json({ success: true, settings: rows });
  } catch (e) {
    console.error('GET /settings', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

// PUT /api/recycle/settings - upsert settings (admin)
// Body: { settings: { shop_address, shop_phone, ship_guide, payment_note } }
//    hoac { shop_address, shop_phone, ... } o cap tren
router.put('/settings', yeuCauDangNhap, yeuCauAdmin, async (req, res) => {
  try {
    const allowed = ['shop_address', 'shop_phone', 'ship_guide', 'payment_note'];
    const source = (req.body.settings && typeof req.body.settings === 'object') ? req.body.settings : req.body;
    const toUpsert = {};
    Object.keys(source).forEach(k => { if (allowed.includes(k)) toUpsert[k] = source[k]; });
    const keys = Object.keys(toUpsert);
    if (!keys.length) return res.status(400).json({ success: false, message: 'Khong co setting hop le de cap nhat.' });
    for (const k of keys) {
      await db.execute(
        `INSERT INTO shop_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
        [k, toUpsert[k] === undefined ? null : String(toUpsert[k])]
      );
    }
    res.json({ success: true, message: 'Da cap nhat settings.' });
  } catch (e) {
    console.error('PUT /settings', e.message);
    res.status(500).json({ success: false, message: 'Loi server.' });
  }
});

module.exports = router;
