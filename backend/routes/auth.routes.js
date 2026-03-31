const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // JWT
const crypto = require('crypto'); //BrCrypt
const nodemailer = require('nodemailer'); //Nodemailer
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

  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
}

/* ===============================
   LOGIN (JWT MEJORADO CON REFRESH)
================================= */
router.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
  }

  const sql = 'SELECT id, nombre, correo, password, rol FROM usuarios WHERE correo = ?';

  db.query(sql, [correo], async (err, results) => {
    if (err) {
      console.error('❌ Error en DB:', err);
      return res.status(500).json({ message: 'Error interno de base de datos' });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({ message: 'Correo no registrado' });
    }

    const user = results[0];

    try {
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }

      // ACCESS TOKEN (15 min)
      const accessToken = jwt.sign(
        {
          userId: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        },
        process.env.JWT_SECRET,   // usa variable de entorno
        { expiresIn: '15m' }
      );

      // REFRESH TOKEN (7 días)
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // GUARDAR REFRESH TOKEN EN BD
      db.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
        [user.id, refreshToken],
        (err) => {
          if (err) {
            console.error('❌ Error guardando refresh token:', err);
          }
        }
      );
      // RESPUESTA AL CLIENTE
      res.status(200).json({
        mensaje: 'Inicio de sesión exitoso',
        accessToken,
        refreshToken,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      });

    } catch (error) {
      console.error('❌ Error en bcrypt:', error);
      res.status(500).json({ message: 'Error al validar contraseña' });
    }
  });
});


/* ===============================
   CAMBIAR CONTRASEÑA (PROTEGIDO)
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
      if (err) return res.status(500).json({ message: 'Error en base de datos' });

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const isValid = await bcrypt.compare(currentPassword, results[0].password);

      if (!isValid) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Error al actualizar contraseña' });
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
    return res.status(400).json({ message: 'Correo requerido' });
  }

  db.query(
    'SELECT id FROM usuarios WHERE correo = ?',
    [correo],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error en base de datos' });

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const userId = results[0].id;
      const token = crypto.randomBytes(32).toString('hex');
      const expire = Date.now() + 600000; // 10 min

      db.query(
        'UPDATE usuarios SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
        [token, expire, userId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Error al guardar token' });
          }

          const resetLink = `http://localhost:8100/changepassw?token=${token}`;

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Recupera tu contraseña',
            html: `
              <p>Haz clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña.</p>
              <p>Este enlace es válido por 10 minutos.</p>
            `
          };

          transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) {
              return res.status(500).json({ message: 'Error al enviar correo' });
            }

            res.json({ message: 'Correo de recuperación enviado' });
          });
        }
      );
    }
  );
});

/* ===============================
   RESET PASSWORD
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
      if (err) return res.status(500).json({ message: 'Error en base de datos' });

      if (
        results.length === 0 ||
        !results[0].resetPasswordExpires ||
        results[0].resetPasswordExpires < Date.now()
      ) {
        return res.status(400).json({ message: 'Token inválido o expirado' });
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
            return res.status(500).json({ message: 'Error al actualizar contraseña' });
          }

          res.json({ message: 'Contraseña actualizada correctamente' });
        }
      );
    }
  );
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token requerido' });
  }

  // Verificar que exista en BD
  db.query(
    'SELECT * FROM refresh_tokens WHERE token = ?',
    [refreshToken],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error en DB' });

      if (results.length === 0) {
        return res.status(403).json({ message: 'Token no válido' });
      }

      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = jwt.sign(
          {
            userId: decoded.userId
          },
          SECRET_KEY,
          { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });

      } catch (error) {
        return res.status(403).json({ message: 'Refresh token expirado' });
      }
    }
  );
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  db.query(
    'DELETE FROM refresh_tokens WHERE token = ?',
    [refreshToken],
    () => {
      res.json({ message: 'Sesión cerrada' });
    }
  );
});


module.exports = router;