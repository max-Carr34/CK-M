const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Nodemailer
const db = require('../db');

const router = express.Router();
const SECRET_KEY = 'ciremab12';

// Configuración Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'carranzamax75@gmail.com',
    pass: 'qnhmpxskfxpcbljy' // Contraseña de aplicación
  }
});

const userRoutes = require('./registro.routes');
router.use('/usuarios', userRoutes);

const authRoutes = require('./auth.routes');
router.use(authRoutes);

const productRoutes = require('./products.routes');
router.use('/products', productRoutes);

const categoryRoutes = require('./categories.routes');
router.use('/categories', categoryRoutes);

const ordersRoutes = require('./orders.routes');
router.use('/orders', ordersRoutes);


module.exports = router;
