const express = require('express');
const router = express.Router();
const db = require('../db');

/* ===============================
   CREAR PEDIDO
================================= */
router.post('/', (req, res) => {
  const { user_id, cart, payment_method } = req.body;

  console.log('📥 BODY:', req.body);

  if (!user_id || !cart || cart.length === 0) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const orderSql = `
    INSERT INTO orders (user_id, total, status, payment_method)
    VALUES (?, ?, 'pending', ?)
  `;

  db.query(orderSql, [user_id, total, payment_method], (err, result) => {

    if (err) {
      console.error('❌ ERROR INSERT ORDER:', err);
      return res.status(500).json({ error: err.message });
    }

    const orderId = result.insertId;

    const itemsSql = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ?
    `;

    const values = cart.map(item => [
      orderId,
      item.id,
      item.quantity,
      item.price
    ]);

    db.query(itemsSql, [values], (err2) => {

      if (err2) {
        console.error('❌ ERROR INSERT ITEMS:', err2);
        return res.status(500).json({ error: err2.message });
      }

      console.log('✅ Pedido creado:', orderId);

      res.json({
        message: 'Pedido creado correctamente',
        orderId
      });

    });

  });

});

/* ===============================
   OBTENER PEDIDOS POR USUARIO
================================= */
router.get('/user/:user_id', (req, res) => {

  const userId = req.params.user_id;

  const sql = `
    SELECT
      id,
      total,
      status,
      created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [userId], (err, results) => {

    if (err) {
      console.error('❌ ERROR GET ORDERS:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);

  });

});

/* ===============================
   OBTENER PEDIDO POR ID
================================= */
router.get('/:id', (req, res) => {

  const orderId = req.params.id;

  // 🔥 Obtener pedido
  const orderSql = `
    SELECT
      id,
      total,
      status,
      payment_method,
      created_at
    FROM orders
    WHERE id = ?
  `;

  db.query(orderSql, [orderId], (err, orderResult) => {

    if (err) {
      console.error('❌ ERROR ORDER:', err);
      return res.status(500).json({ error: err.message });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      });
    }

    const order = orderResult[0];

    // 🔥 Obtener productos del pedido
    const itemsSql = `
      SELECT
        oi.product_id,
        oi.quantity,
        oi.price,

        p.name AS product_name,
        p.image

      FROM order_items oi

      INNER JOIN products p
        ON oi.product_id = p.id

      WHERE oi.order_id = ?
    `;

    db.query(itemsSql, [orderId], (err2, itemsResult) => {

      if (err2) {
        console.error('❌ ERROR ITEMS:', err2);
        return res.status(500).json({
          error: err2.message
        });
      }

      // 🔥 Respuesta final completa
      res.json({
        ...order,
        products: itemsResult
      });

    });

  });

});

/* ===============================
   TEST ROUTE (DEBUG)
================================= */
router.get('/', (req, res) => {
  res.json({ message: 'Orders funcionando 🔥' });
});

module.exports = router;