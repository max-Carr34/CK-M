const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

/* ===============================
   CONFIG
================================= */
const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!SECRET_KEY || !REFRESH_SECRET) {
  throw new Error('Faltan variables JWT en .env');
}

/* ===============================
   MAIL
================================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ===============================
   MIDDLEWARE TOKEN
================================= */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: 'Token requerido' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
}

/* ===============================
   LOGIN
================================= */
router.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  db.query(
    'SELECT * FROM usuarios WHERE correo = ?',
    [correo],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error DB' });

      if (results.length === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      const user = results[0];

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          rol: user.rol
        },
        SECRET_KEY,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      db.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
        [user.id, refreshToken]
      );

      res.json({
        accessToken,
        refreshToken,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      });
    }
  );
});

/* ===============================
   LOGOUT
================================= */
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Token requerido' });
  }

  db.query(
    'DELETE FROM refresh_tokens WHERE token = ?',
    [refreshToken],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error logout' });
      res.json({ message: 'Logout exitoso' });
    }
  );
});

/* ===============================
   REFRESH TOKEN
================================= */
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  db.query(
    'SELECT * FROM refresh_tokens WHERE token = ?',
    [refreshToken],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error DB' });

      if (results.length === 0) {
        return res.status(403).json({ message: 'Token inválido' });
      }

      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const newAccessToken = jwt.sign(
          { userId: decoded.userId },
          SECRET_KEY,
          { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });

      } catch {
        return res.status(403).json({ message: 'Token expirado' });
      }
    }
  );
});

/* ===============================
   CAMBIAR PASSWORD
================================= */
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  db.query(
    'SELECT password FROM usuarios WHERE id = ?',
    [userId],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error DB' });

      const valid = await bcrypt.compare(currentPassword, results[0].password);

      if (!valid) {
        return res.status(400).json({ message: 'Contraseña incorrecta' });
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      db.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashed, userId],
        () => {

          // CERRAR TODAS LAS SESIONES
          db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

          res.json({ message: 'Contraseña actualizada' });
        }
      );
    }
  );
});

/* ===============================
   SOLICITAR RESET
================================= */
router.post('/request-reset-password', (req, res) => {
  const { correo } = req.body;

  if (!correo) return res.status(400).json({ message: 'Correo requerido' });

  db.query(
    'SELECT id FROM usuarios WHERE correo = ?',
    [correo],
    (err, results) => {
      if (results.length === 0) {
        return res.status(404).json({ message: 'No existe usuario' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expire = Date.now() + 600000;

      db.query(
        'UPDATE usuarios SET resetPasswordToken=?, resetPasswordExpires=? WHERE id=?',
        [token, expire, results[0].id]
      );

      const link = `http://localhost:8100/changepassw?token=${token}`;

      transporter.sendMail({
        to: correo,
        subject: 'Reset Password',
        html: `<a href="${link}">Cambiar contraseña</a>`
      });

      res.json({ message: 'Correo enviado' });
    }
  );
});

/* ===============================
   RESET PASSWORD
================================= */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  db.query(
    'SELECT id, resetPasswordExpires FROM usuarios WHERE resetPasswordToken = ?',
    [token],
    async (err, results) => {

      if (
        results.length === 0 ||
        results[0].resetPasswordExpires < Date.now()
      ) {
        return res.status(400).json({ message: 'Token inválido' });
      }

      const userId = results[0].id;
      const hashed = await bcrypt.hash(newPassword, 10);

      db.query(
        `UPDATE usuarios 
         SET password=?, resetPasswordToken=NULL, resetPasswordExpires=NULL 
         WHERE id=?`,
        [hashed, userId],
        () => {

          // CERRAR TODAS LAS SESIONES
          db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

          res.json({ message: 'Contraseña actualizada' });
        }
      );
    }
  );
});

module.exports = router;