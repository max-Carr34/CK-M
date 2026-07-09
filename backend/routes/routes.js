const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();
const SECRET_KEY = 'ciremab12';

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
