const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

router.post('/', async (req, res) => {
  const { nombre, correo, password, rol = 'usuario' } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Campos obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password débil' });
  }

  db.query(
    'SELECT id FROM usuarios WHERE correo = ?',
    [correo],
    async (err, results) => {
      if (results.length > 0) {
        return res.status(409).json({ error: 'Correo ya existe' });
      }

      const hashed = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, correo, hashed, rol],
        (err, result) => {

          const userId = result.insertId;

          const accessToken = jwt.sign(
            { userId, rol },
            SECRET_KEY,
            { expiresIn: '15m' }
          );

          const refreshToken = jwt.sign(
            { userId },
            REFRESH_SECRET,
            { expiresIn: '7d' }
          );

          db.query(
            'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
            [userId, refreshToken]
          );

          res.json({
            accessToken,
            refreshToken,
            usuario: { id: userId, nombre, correo, rol }
          });
        }
      );
    }
  );
});

module.exports = router;