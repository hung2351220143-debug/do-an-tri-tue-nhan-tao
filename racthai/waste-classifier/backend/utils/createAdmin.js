/**
 * Script tạo tài khoản admin mặc định
 * Chạy: node utils/createAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'waste_classifier'
  });

  try {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    
    await conn.execute(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = ?, updated_at = NOW()`,
      ['admin', 'admin@waste.com', passwordHash, 'admin', passwordHash]
    );

    console.log('✅ Tài khoản admin đã được tạo/cập nhật:');
    console.log('   Email: admin@waste.com');
    console.log('   Password: Admin@123');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await conn.end();
  }
}

createAdmin();
