/**
 * auth.js - MIDDLEWARE XAC THUC NGUOI DUNG
 * Ba loai middleware:
 *   - yeuCauDangNhap:  bat buoc phai co token
 *   - tuyChonDangNhap: co token thi lay user, khong co thi tiep tuc nhu khach
 *   - yeuCauAdmin:     chi admin moi duoc vao
 */
const jwt = require('jsonwebtoken');
const db  = require('../config/database');

const BI_MAT_JWT = process.env.JWT_SECRET || 'bi_mat_mac_dinh';

// Kiem tra user trong DB va con active khong
async function layThongTinUser(userId) {
  const [rows] = await db.execute(
    'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
    [userId]
  );
  return rows[0] || null;
}

// --------------------------------------------
// BAT BUOC DANG NHAP
// --------------------------------------------
const yeuCauDangNhap = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chua dang nhap. Vui long dang nhap de tiep tuc.' });
    }

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, BI_MAT_JWT);
    const user    = await layThongTinUser(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Tai khoan khong hop le hoac da bi khoa.' });
    }

    req.user = user;
    next();
  } catch (loi) {
    const thongBao = loi.name === 'TokenExpiredError'
      ? 'Phien dang nhap het han. Vui long dang nhap lai.'
      : 'Token khong hop le.';
    return res.status(401).json({ success: false, message: thongBao });
  }
};

// --------------------------------------------
// TUY CHON DANG NHAP (khach van dung duoc)
// --------------------------------------------
const tuyChonDangNhap = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, BI_MAT_JWT);
      const user    = await layThongTinUser(decoded.userId);
      if (user?.is_active) req.user = user;
    }
  } catch { /* Khong co token hoac token loi → coi la khach */ }
  next();
};

// --------------------------------------------
// BAT BUOC LA ADMIN
// --------------------------------------------
const yeuCauAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Ban khong co quyen truy cap trang nay.' });
  }
  next();
};

module.exports = { yeuCauDangNhap, tuyChonDangNhap, yeuCauAdmin };
