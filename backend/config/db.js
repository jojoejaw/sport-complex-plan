const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Connection Pool ไปยัง MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ทดสอบความเชื่อมต่อเบื้องต้น
pool.getConnection()
  .then(conn => {
    console.log('✅ เชื่อมต่อ MySQL Database สำเร็จ!');
    conn.release(); // คืนการเชื่อมต่อกลับเข้า Pool
  })
  .catch(err => {
    console.error('❌ เชื่อมต่อฐานข้อมูลล้มเหลว:', err.message);
  });

module.exports = pool;