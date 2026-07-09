const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error DB:', err);
    return;
  }

  console.log('✅ MySQL conectado');
  connection.release();
});

module.exports = pool;