-- ============================================================
-- ECOSCAN – DATABASE SCHEMA ĐẦY ĐỦ (v2.0)
-- Dán toàn bộ vào phpMyAdmin > SQL rồi bấm Go
-- Cập nhật: 2025 – 14 bảng
-- ============================================================

CREATE DATABASE IF NOT EXISTS waste_classifier
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE waste_classifier;

-- ────────────────────────────────────────────────────────────
-- 1. USERS – Tài khoản (admin / staff / user)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','staff','user') DEFAULT 'user',
  is_active     TINYINT(1)   DEFAULT 1,
  avatar        VARCHAR(255) DEFAULT NULL,
  phone         VARCHAR(20)  DEFAULT NULL,
  full_name     VARCHAR(100) DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP    NULL DEFAULT NULL,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nâng cấp từ schema cũ (bỏ qua nếu đã có)
ALTER TABLE users MODIFY COLUMN role ENUM('admin','staff','user') DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone     VARCHAR(20)  DEFAULT NULL AFTER avatar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) DEFAULT NULL AFTER phone;

-- ────────────────────────────────────────────────────────────
-- 2. CLASSIFICATIONS – Kết quả phân loại ảnh AI
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classifications (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NULL DEFAULT NULL,
  image_path        VARCHAR(255) NOT NULL,
  image_hash        VARCHAR(64)  NULL DEFAULT NULL,
  original_filename VARCHAR(255) NULL,
  result_json       LONGTEXT     NULL,
  status            ENUM('pending','completed','failed') DEFAULT 'completed',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id    (user_id),
  INDEX idx_image_hash (image_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 3. CHAT_HISTORY – Lịch sử chat AI
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NULL DEFAULT NULL,
  session_id  VARCHAR(100) NULL DEFAULT NULL,
  message     TEXT         NOT NULL,
  response    LONGTEXT     NOT NULL,
  tokens_used INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id    (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 4. API_USAGE – Log sử dụng API Gemini
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_usage (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  endpoint     VARCHAR(100) NOT NULL,
  user_id      INT          NULL DEFAULT NULL,
  tokens_used  INT          DEFAULT 0,
  status       ENUM('success','error','cached') DEFAULT 'success',
  ip_address   VARCHAR(45)  NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_endpoint   (endpoint),
  INDEX idx_user_id    (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 5. RATINGS – Đánh giá kết quả phân loại
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  classification_id INT     NOT NULL,
  user_id           INT     NULL DEFAULT NULL,
  stars             TINYINT NOT NULL DEFAULT 5  COMMENT '1-5 sao',
  comment           TEXT    NULL,
  admin_reply       TEXT    NULL,
  replied_at        TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classification_id) REFERENCES classifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)           REFERENCES users(id)           ON DELETE SET NULL,
  UNIQUE KEY unique_rating (classification_id, user_id),
  INDEX idx_classification_id (classification_id),
  INDEX idx_stars              (stars),
  INDEX idx_created_at         (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm admin_reply nếu thiếu
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS admin_reply TEXT NULL AFTER comment;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS replied_at  TIMESTAMP NULL DEFAULT NULL AFTER admin_reply;

-- ────────────────────────────────────────────────────────────
-- 6. FEEDBACKS – Phản hồi / Liên hệ
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NULL DEFAULT NULL,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL,
  subject     VARCHAR(200) NOT NULL,
  message     TEXT         NOT NULL,
  status      ENUM('pending','read','replied') DEFAULT 'pending',
  admin_reply LONGTEXT     NULL,
  replied_at  TIMESTAMP    NULL DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status     (status),
  INDEX idx_user_id    (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 7. APP_CONFIG – Cài đặt ứng dụng (tên, logo, link tải)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  config_key   VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT         NULL,
  description  VARCHAR(255) NULL,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_config (config_key, config_value, description) VALUES
  ('ios_web_url',      '',        'Link web iOS (ngrok URL)'),
  ('apk_url',          '',        'Link tải file APK Android'),
  ('apk_version',      '1.0.0',   'Phiên bản APK hiện tại'),
  ('apk_size',         '',        'Kích thước file APK'),
  ('app_name',         'EcoScan', 'Tên ứng dụng'),
  ('app_logo',         '',        'URL logo ứng dụng'),
  ('download_enabled', '1',       'Bật/tắt section tải app')
ON DUPLICATE KEY UPDATE config_key = config_key;

-- ────────────────────────────────────────────────────────────
-- 8. BANNER_SLIDES – Carousel trang chủ
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banner_slides (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NULL,
  subtitle    VARCHAR(500) NULL,
  image_url   VARCHAR(500) NOT NULL,
  link_url    VARCHAR(500) NULL,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1,
  created_by  INT          NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active  (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 9. STAFF_CHATS – Cuộc hội thoại khách ↔ nhân viên
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_chats (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NULL DEFAULT NULL,
  staff_id     INT          NULL DEFAULT NULL,
  guest_name   VARCHAR(100) DEFAULT 'Khách',
  guest_email  VARCHAR(100) NULL,
  subject      VARCHAR(200) DEFAULT 'Hỗ trợ chung',
  status       ENUM('waiting','active','closed') DEFAULT 'waiting',
  last_message TEXT         NULL,
  last_msg_at  TIMESTAMP    NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id   (user_id),
  INDEX idx_staff_id  (staff_id),
  INDEX idx_status    (status),
  INDEX idx_last_msg  (last_msg_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 10. STAFF_MESSAGES – Tin nhắn realtime (text/file/ảnh)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  chat_id     INT  NOT NULL,
  sender_id   INT  NULL DEFAULT NULL,
  sender_type ENUM('user','staff','system') NOT NULL,
  message     TEXT NULL,
  file_url    VARCHAR(500) NULL,
  file_name   VARCHAR(255) NULL,
  file_type   VARCHAR(100) NULL,
  is_read     TINYINT(1)   DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id)   REFERENCES staff_chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)       ON DELETE SET NULL,
  INDEX idx_chat_id    (chat_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read    (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 11. RECYCLE_PRICES – Bảng giá thu mua rác (admin quản lý)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycle_prices (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category       VARCHAR(100)   NOT NULL UNIQUE COMMENT 'recyclable-plastic/...',
  name_vi        VARCHAR(200)   NOT NULL        COMMENT 'Tên tiếng Việt',
  price_per_unit DECIMAL(10,2)  NOT NULL DEFAULT 0 COMMENT 'Giá/đơn vị (VNĐ)',
  unit           VARCHAR(50)    DEFAULT 'cái'   COMMENT 'cái/chai/kg/tờ...',
  min_quantity   INT            DEFAULT 1       COMMENT 'Số lượng tối thiểu',
  quality_note   TEXT           NULL            COMMENT 'Tiêu chuẩn chất lượng',
  is_active      TINYINT(1)     DEFAULT 1,
  image_url      VARCHAR(500)   NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO recycle_prices (category, name_vi, price_per_unit, unit, min_quantity, quality_note, is_active) VALUES
  ('recyclable-plastic', 'Chai nhựa PET',      500,   'chai', 5,  'Chai sạch, không móp méo, còn nguyên vẹn',              1),
  ('recyclable-paper',   'Sách báo / Giấy cũ', 2000,  'kg',   1,  'Khô, không ướt, không dính băng keo nhiều',             1),
  ('recyclable-glass',   'Chai lọ thủy tinh',  1000,  'cái',  3,  'Còn nguyên vẹn, không vỡ, rửa sạch',                   1),
  ('recyclable-metal',   'Lon nhôm',            800,   'cái',  10, 'Nghiền dẹt hoặc nguyên, không gỉ sét',                  1),
  ('electronic',         'Điện thoại cũ',       50000, 'cái',  1,  'Còn nguồn hoặc còn linh kiện có giá trị',               1)
ON DUPLICATE KEY UPDATE name_vi = VALUES(name_vi), price_per_unit = VALUES(price_per_unit);

-- ────────────────────────────────────────────────────────────
-- 12. SHOP_SETTINGS – Cài đặt shop thu mua
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_settings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT         NULL,
  description   VARCHAR(255) NULL,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO shop_settings (setting_key, setting_value, description) VALUES
  ('shop_address',   '123 Đường ABC, Quận 1, TP.HCM',
                     'Địa chỉ nhận hàng'),
  ('shop_phone',     '0901234567',
                     'Số điện thoại shop'),
  ('ship_guide',     'Đóng gói cẩn thận, ghi rõ họ tên và mã đơn hàng lên kiện hàng. Gửi qua bưu điện hoặc shipper đến địa chỉ trên.',
                     'Hướng dẫn gửi hàng'),
  ('payment_note',   'Shop sẽ chuyển tiền trong 24-48 giờ sau khi nhận và kiểm tra hàng.',
                     'Ghi chú thanh toán')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- ────────────────────────────────────────────────────────────
-- 13. RECYCLE_ORDERS – Đơn bán rác của khách
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycle_orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  order_code           VARCHAR(20)    NOT NULL UNIQUE COMMENT 'Mã đơn RC-XXXXXX',
  user_id              INT            NULL DEFAULT NULL,
  guest_name           VARCHAR(100)   NULL,
  guest_phone          VARCHAR(20)    NULL,
  items                JSON           NOT NULL COMMENT '[{category,name_vi,quantity,price_per_unit,subtotal}]',
  total_amount         DECIMAL(12,2)  NOT NULL DEFAULT 0,
  qr_image_url         VARCHAR(500)   NULL COMMENT 'Ảnh QR hoặc TK ngân hàng của khách',
  bank_info            TEXT           NULL,
  status               ENUM('pending','confirmed','received','paid','cancelled') DEFAULT 'pending',
  staff_id             INT            NULL COMMENT 'Nhân viên/admin xử lý',
  staff_note           TEXT           NULL,
  payment_proof_url    VARCHAR(500)   NULL COMMENT 'Ảnh chứng từ thanh toán (admin gửi)',
  received_proof_url   VARCHAR(500)   NULL COMMENT 'Ảnh xác nhận đã nhận hàng',
  confirmed_at         TIMESTAMP      NULL,
  received_at          TIMESTAMP      NULL,
  paid_at              TIMESTAMP      NULL,
  created_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id    (user_id),
  INDEX idx_status     (status),
  INDEX idx_order_code (order_code),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 14. Upgrade cho các cột mới trong recycle_orders (nếu cần)
-- ────────────────────────────────────────────────────────────
ALTER TABLE recycle_orders
  ADD COLUMN IF NOT EXISTS payment_proof_url  VARCHAR(500) NULL AFTER staff_note,
  ADD COLUMN IF NOT EXISTS received_proof_url VARCHAR(500) NULL AFTER payment_proof_url,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP NULL AFTER received_proof_url,
  ADD COLUMN IF NOT EXISTS received_at  TIMESTAMP NULL AFTER confirmed_at,
  ADD COLUMN IF NOT EXISTS paid_at      TIMESTAMP NULL AFTER received_at;

-- ────────────────────────────────────────────────────────────
-- TÀI KHOẢN MẶC ĐỊNH (Password: Admin@123)
-- Sau khi chạy, đổi mật khẩu bằng: node utils/createAdmin.js
-- ────────────────────────────────────────────────────────────
INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin', 'admin@waste.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin')
ON DUPLICATE KEY UPDATE username = username;

-- ────────────────────────────────────────────────────────────
-- KIỂM TRA KẾT QUẢ
-- ────────────────────────────────────────────────────────────
SELECT
  table_name AS `Bảng`,
  table_rows AS `Số hàng (ước tính)`,
  ROUND(data_length/1024, 1) AS `Dung lượng (KB)`
FROM information_schema.tables
WHERE table_schema = 'waste_classifier'
ORDER BY table_name;
