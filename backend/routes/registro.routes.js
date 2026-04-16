const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/* ===============================
   REGISTRO DE USUARIO
================================= */
router.post('/', async (req, res) => {
  const { nombre, correo, password, rol = 'usuario' } = req.body;

  // 🔍 Validaciones básicas
  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Campos obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password débil (mínimo 6 caracteres)' });
  }

  try {
    //  Verificar si el correo ya existe
    db.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo],
      async (err, results) => {

        if (err) {
          console.error('❌ Error en SELECT:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        if (results.length > 0) {
          return res.status(409).json({ error: 'Correo ya registrado' });
        }

        try {
          // Encriptar contraseña
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insertar usuario
          db.query(
            'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, correo, hashedPassword, rol],
            (err, result) => {

              if (err) {
                console.error('❌ Error en INSERT:', err);
                return res.status(500).json({ error: 'Error al registrar usuario' });
              }

              const userId = result.insertId;

              // Generar tokens
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

              // Guardar refresh token
              db.query(
                'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
                [userId, refreshToken],
                (err) => {
                  if (err) {
                    console.error('⚠️ Error guardando refresh token:', err);
                  }
                }
              );

              // RESPUESTA FINAL (IMPORTANTE: return)
              return res.status(201).json({
                message: 'Usuario registrado correctamente',
                accessToken,
                refreshToken,
                usuario: {
                  id: userId,
                  nombre,
                  correo,
                  rol
                }
              });
            }
          );
        } catch (error) {
          console.error('❌ Error en bcrypt:', error);
          return res.status(500).json({ error: 'Error al procesar contraseña' });
        }
      }
    );

  } catch (error) {
    console.error('❌ Error general:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;