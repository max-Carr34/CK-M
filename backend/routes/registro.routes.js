const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔐 Tomar el secreto desde variables de entorno
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET no está definido en el archivo .env');
}

/* ===============================
   REGISTRO DE USUARIO
   POST /api/usuarios
================================ */
router.post('/', async (req, res) => {
  try {
    const { nombre, correo, password, rol = 'usuario' } = req.body;

    // ✅ Validación básica
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // ✅ Verificar si el correo ya existe
    db.query('SELECT id FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
      if (err) {
        console.error('❌ Error verificando correo:', err);
        return res.status(500).json({ error: 'Error al verificar correo' });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: 'El correo ya está registrado' });
      }

      try {
        // ✅ Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
          INSERT INTO usuarios (nombre, correo, password, rol)
          VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [nombre, correo, hashedPassword, rol], (dbErr, result) => {
          if (dbErr) {
            console.error('❌ Error al insertar usuario:', dbErr);
            return res.status(500).json({
              error: 'Error al registrar usuario'
            });
          }

          // ✅ Generar token
          const token = jwt.sign(
            {
              userId: result.insertId,
              nombre,
              correo,
              rol
            },
            SECRET_KEY,
            { expiresIn: '1h' }
          );

          res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            usuario: {
              id: result.insertId,
              nombre,
              correo,
              rol
            }
          });
        });

      } catch (hashError) {
        console.error('❌ Error en hash:', hashError);
        return res.status(500).json({ error: 'Error al procesar la contraseña' });
      }
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;