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
   MIDDLEWARE AUTH
================================= */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }

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
   ROLE MIDDLEWARE
================================= */
function role(roles = []) {
  return (req, res, next) => {
    const userRole = req.user?.rol;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'No tienes permisos' });
    }

    next();
  };
}

/* ===============================
   LOG HELPER (SIN IP)
================================= */
function logAction(userId, action) {
  db.query(
    'INSERT INTO access_logs (user_id, action) VALUES (?, ?)',
    [userId, action],
    (err) => {
      if (err) console.error('Error en logAction:', err);
    }
  );
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

      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error DB' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      const user = results[0];

      try {
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
          return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const accessToken = jwt.sign(
          { userId: user.id, rol: user.rol },
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
          [user.id, refreshToken],
          (err) => {
            if (err) {
              console.error('Error guardando refresh token:', err);
            }
          }
        );

        logAction(user.id, 'LOGIN');

        return res.json({
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
        console.error(error);
        return res.status(500).json({ message: 'Error interno' });
      }
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

      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error logout' });
      }

      return res.json({ message: 'Logout exitoso' });
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
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error DB' });
      }

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

        return res.json({ accessToken: newAccessToken });

      } catch (error) {

        console.error('Error verificando refresh token:', error);

        return res.status(403).json({ message: 'Token expirado' });
      }
    }
  );
});

/* ===============================
   FINALIZAR RESET PASSWORD (La que te falta)
================================= */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token y contraseña requeridos' });
  }

  // 1. Buscamos al usuario que tiene ese token y verificamos que no haya expirado
  db.query(
    'SELECT id FROM usuarios WHERE resetPasswordToken = ? AND resetPasswordExpires > ?',
    [token, Date.now()],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error en la base de datos' });
      
      if (results.length === 0) {
        return res.status(400).json({ message: 'Token inválido o expirado' });
      }

      const userId = results[0].id;

      try {
        // 2. Hasheamos la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Actualizamos la contraseña y limpiamos el token (lo ponemos en NULL)
        db.query(
          'UPDATE usuarios SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?',
          [hashedPassword, userId],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Error al actualizar contraseña' });
            }
            res.json({ message: 'Contraseña actualizada con éxito' });
          }
        );
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error procesando la contraseña' });
      }
    }
  );
});

/* ===============================
   CHANGE PASSWORD
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
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error DB' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      try {
        const valid = await bcrypt.compare(currentPassword, results[0].password);

        if (!valid) {
          return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        db.query(
          'UPDATE usuarios SET password = ? WHERE id = ?',
          [hashed, userId],
          (err) => {

            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Error al actualizar' });
            }

            db.query(
              'DELETE FROM refresh_tokens WHERE user_id = ?',
              [userId],
              (err) => {
                if (err) console.error('Error limpiando tokens:', err);
              }
            );

            logAction(userId, 'CHANGE_PASSWORD');

            return res.json({ message: 'Contraseña actualizada' });
          }
        );

      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno' });
      }
    }
  );
});

/* ===============================
   SOLICITAR RESET PASSWORD
================================= */
router.post('/request-reset-password', (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'Correo es requerido' });
  }

  // 1. Verificar si el usuario existe
  db.query('SELECT id FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Error DB' });
    if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const userId = results[0].id;
    
    // 2. Generar token único
    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 900000; // 15 minutos de validez

    // 3. Guardar en BD
    db.query(
      'UPDATE usuarios SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
      [token, expires, userId],
      (err) => {
        if (err) return res.status(500).json({ message: 'Error actualizando token' });

        // --- CORRECCIÓN AQUÍ: Definimos la URL completa ---
        const resetUrl = `${process.env.FRONTEND_URL}/changepassw?token=${token}`;

        // 4. Enviar correo
        const mailOptions = {
          from: 'carranzamax75@gmail.com',
          to: correo,
          subject: 'Recuperación de contraseña',
          html: `<p>Hola,</p>
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                  <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
                  <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">
                    Restablecer mi contraseña
                  </a>
                  <p>⏱️ Este enlace expirará en <strong>15 minutos</strong> por motivos de seguridad.</p>
                  <p>Si tú no solicitaste este cambio, puedes ignorar este mensaje: tu contraseña seguirá siendo la misma.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error enviando correo' });
          }
          res.json({ message: 'Correo de recuperación enviado' });
        });
      }
    );
  });
});

/* ===============================
   ADMIN STATS
================================= */
router.get('/admin/stats', verifyToken, role(['admin']), (req, res) => {

  const stats = {};

  db.query('SELECT COUNT(*) AS totalUsers FROM usuarios', (err, users) => {

    // 🔥 1. ERROR + LOG
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error DB' });
    }

    // 🔥 2. VALIDAR RESULTADO (TE FALTABA)
    if (!users || users.length === 0) {
      return res.status(500).json({ error: 'Error obteniendo usuarios' });
    }

    stats.totalUsers = users[0].totalUsers;

    db.query("SELECT COUNT(*) AS admins FROM usuarios WHERE rol='admin'", (err2, admins) => {

      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Error DB' });
      }

      if (!admins || admins.length === 0) {
        return res.status(500).json({ error: 'Error obteniendo admins' });
      }

      stats.admins = admins[0].admins;

      db.query("SELECT COUNT(*) AS activeUsers FROM usuarios WHERE is_active = 1", (err3, active) => {

        if (err3) {
          console.error(err3);
          return res.status(500).json({ error: 'Error DB' });
        }

        if (!active || active.length === 0) {
          return res.status(500).json({ error: 'Error obteniendo activos' });
        }

        stats.activeUsers = active[0].activeUsers;

        return res.json(stats);
      });
    });
  });
});

/* ===============================
   ADMIN LOGS
================================= */
router.get('/admin/logs', verifyToken, role(['admin']), (req, res) => {
  db.query(`
    SELECT l.id, u.nombre, l.action, l.created_at
    FROM access_logs l
    JOIN usuarios u ON u.id = l.user_id
    ORDER BY l.created_at DESC
    LIMIT 100
  `, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al obtener logs' });
    }

    if (!results) {
      return res.status(500).json({ message: 'Error en resultados' });
    }

    return res.json(results);
  });
});
/* ===============================
   ADMIN DELETE USER
================================= */
router.delete('/admin/users/:id', verifyToken, role(['admin']), (req, res) => {

  const userId = req.params.id;

  db.query('DELETE FROM usuarios WHERE id = ?', [userId], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al eliminar usuario' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    logAction(userId, 'DELETED_BY_ADMIN');
    return res.json({ message: 'Usuario eliminado' });
  });
});

/* ===============================
   ADMIN FORCE LOGOUT
================================= */
router.post('/admin/force-logout/:id', verifyToken, role(['admin']), (req, res) => {

  const userId = req.params.id;

  db.query(
    'DELETE FROM refresh_tokens WHERE user_id = ?',
    [userId],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error cerrando sesión' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario sin sesiones activas' });
      }

      logAction(userId, 'FORCE_LOGOUT');

      return res.json({ message: 'Sesión cerrada por admin' });
    }
  );
});

/* ===============================
   ADMIN GET USERS
================================= */
router.get('/admin/users', verifyToken, role(['admin']), (req, res) => {
  db.query(
    `SELECT id, nombre, correo, rol, is_active 
     FROM usuarios 
     ORDER BY id DESC`,
    (err, results) => {

      if (err) {
        console.error('Error users:', err);
        return res.status(500).json({ message: 'Error al obtener usuarios' });
      }
      if (!results) {
        return res.status(500).json({ message: 'Error en resultados' });
      }
      return res.json(results);
    }
  );
});

/* ===============================
   ADMIN UPDATE USER (correo)
================================= */
router.put('/admin/users/:id', verifyToken, role(['admin']), (req, res) => {
  const id = req.params.id;
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'Correo requerido' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ message: 'Correo inválido' });
  }

  db.query(
    'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
    [correo, id],
    (err, exists) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error DB' });
      }

      if (!exists) {
        return res.status(500).json({ message: 'Error en resultados' });
      }

      if (exists.length > 0) {
        return res.status(400).json({ message: 'Correo ya en uso' });
      }

      db.query(
        'UPDATE usuarios SET correo = ? WHERE id = ?',
        [correo, id],
        (err2, result) => {

          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: 'Error al actualizar' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
          }

          logAction(id, 'UPDATED_BY_ADMIN');

          return res.json({ message: 'Usuario actualizado correctamente' });
        }
      );
    }
  );
});

/* ===============================
   ADMIN ACTIVE SESSIONS
================================= */
router.get('/admin/sessions', verifyToken, role(['admin']), (req, res) => {
  db.query(`
    SELECT rt.user_id, u.nombre, u.correo
    FROM refresh_tokens rt
    JOIN usuarios u ON u.id = rt.user_id
  `, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error sesiones' });
    }

    if (!results) {
      return res.status(500).json({ message: 'Error en resultados' });
    }

    return res.json(results);
  });
});

module.exports = router;