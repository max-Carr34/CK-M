const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

// 🔐 Tomar el secreto desde variables de entorno
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET no está definido en el archivo .env');
}

// 🧠 Middleware para verificar roles
function verifyRole(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }

      if (!roles.includes(decoded.rol)) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      req.user = decoded;
      next();
    });
  };
}

// 🔐 RUTA DE LOGIN
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

      console.log(`✅ Usuario ${user.nombre} (${user.rol}) inició sesión.`);

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

module.exports = router;