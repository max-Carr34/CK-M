const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

/* ===============================
   CONFIGURACIÓN
================================= */
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET no está definido en el archivo .env');
}

/* ===============================
   CONFIGURAR NODEMAILER
================================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ===============================
   MIDDLEWARE: VERIFY TOKEN
================================= */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
}

/* ===============================
   LOGIN
================================= */
router.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  const sql = 'SELECT id, nombre, correo, password, rol FROM usuarios WHERE correo = ?';

  db.query(sql, [correo], async (err, results) => {
    if (err) {
      console.error('❌ Error en DB:', err);
      return res.status(500).json({ error: 'Error interno de base de datos' });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({ error: 'Correo no registrado' });
    }

    const user = results[0];

    try {
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        mensaje: 'Inicio de sesión exitoso',
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      });

    } catch (error) {
      console.error('❌ Error en bcrypt:', error);
      res.status(500).json({ error: 'Error al validar contraseña' });
    }
  });
});

/* ===============================
   CAMBIAR CONTRASEÑA (LOGUEADO)
================================= */
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  db.query(
    'SELECT password FROM usuarios WHERE id = ?',
    [userId],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en base de datos' });

      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const isValid = await bcrypt.compare(currentPassword, results[0].password);

      if (!isValid) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: 'Error al actualizar contraseña' });
          }

          res.json({ message: 'Contraseña actualizada correctamente' });
        }
      );
    }
  );
});

/* ===============================
   SOLICITAR RECUPERACIÓN
================================= */
router.post('/request-reset-password', (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ error: 'Correo requerido' });
  }

  db.query(
    'SELECT id FROM usuarios WHERE correo = ?',
    [correo],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en base de datos' });

      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const userId = results[0].id;
      const token = crypto.randomBytes(32).toString('hex');
      const expire = Date.now() + 3600000; // 1 hora

      db.query(
        'UPDATE usuarios SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
        [token, expire, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: 'Error al guardar token' });
          }

          const resetLink = `http://localhost:8100/change-password?token=${token}`;

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Recupera tu contraseña',
            html: `
              <p>Haz clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña.</p>
              <p>Este enlace es válido por 1 hora.</p>
            `
          };

          transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) {
              return res.status(500).json({ error: 'Error al enviar correo' });
            }

            res.json({ message: 'Correo de recuperación enviado' });
          });
        }
      );
    }
  );
});

/* ===============================
   RESET PASSWORD CON TOKEN
================================= */
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Datos faltantes' });
  }

  db.query(
    'SELECT id, resetPasswordExpires FROM usuarios WHERE resetPasswordToken = ?',
    [token],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en base de datos' });

      if (
        results.length === 0 ||
        !results[0].resetPasswordExpires ||
        results[0].resetPasswordExpires < Date.now()
      ) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      const userId = results[0].id;

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        `UPDATE usuarios 
         SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL 
         WHERE id = ?`,
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: 'Error al actualizar contraseña' });
          }

          res.json({ message: 'Contraseña actualizada correctamente' });
        }
      );
    }
  );
});

module.exports = router;