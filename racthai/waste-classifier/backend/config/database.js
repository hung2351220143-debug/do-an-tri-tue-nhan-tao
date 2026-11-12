/**
 * database.js - KET NOI CO SO DU LIEU MySQL (XAMPP)
 * Tao pool ket noi de dung chung trong toan bo app
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            process.env.DB_PORT     || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'waste_classifier',
  waitForConnections: true,
  connectionLimit: 10,   // Toi da 10 ket noi dong thoi
  queueLimit:      0,
  charset:         'utf8mb4',
  timezone:        '+07:00'  // Gio Viet Nam
});

// Kiem tra ket noi khi khoi dong
pool.getConnection()
  .then(conn => {
    console.log('✅ Ket noi MySQL thanh cong');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Loi ket noi MySQL:', err.message);
    console.error('   → Kiem tra XAMPP da bat MySQL chua?');
    console.error('   → Database "waste_classifier" da tao chua?');
  });

module.exports = pool;
