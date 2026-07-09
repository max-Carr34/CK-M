const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'maxi1407',
  database: process.env.DB_NAME || 'snackcenter',
  port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error DB:', err);
    return;
  }
  console.log('✅ MySQL conectado');
});

module.exports = connection;