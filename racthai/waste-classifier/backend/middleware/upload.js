/**
 * upload.js - CAU HINH UPLOAD ANH
 * Dung thu vien multer de xu ly file anh nguoi dung gui len
 * Chi chap nhan: JPG, PNG, GIF, WEBP - toi da 10MB
 */
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Tao thu muc luu anh neu chua co
const thuMucAnh = path.join(__dirname, '../uploads');
if (!fs.existsSync(thuMucAnh)) fs.mkdirSync(thuMucAnh, { recursive: true });

// Cau hinh luu file: dat ten theo timestamp de tranh trung
const cauHinhLuu = multer.diskStorage({
  destination: (req, file, cb) => cb(null, thuMucAnh),
  filename:    (req, file, cb) => {
    const tenDuy = `rac-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const duoiFile = path.extname(file.originalname).toLowerCase();
    cb(null, tenDuy + duoiFile);
  }
});

// Chi chap nhan file anh
const locFile = (req, file, cb) => {
  const loaiChapNhan = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (loaiChapNhan.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chi chap nhan file anh (JPG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage: cauHinhLuu,
  fileFilter: locFile,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
