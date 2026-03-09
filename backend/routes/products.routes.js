const express = require('express');
const router = express.Router();
const db = require('../db');

/* ===============================
   CREAR PRODUCTO (ADMIN)
================================= */
router.post('/', (req, res) => {
  const {
    name,
    description,
    price,
    image,
    category_id,
    stock,
    isPopular
  } = req.body;

  const sql = `
    INSERT INTO products
    (name, description, price, image, category_id, stock, isPopular, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `;

  db.query(
    sql,
    [
      name,
      description,
      price,
      image,
      category_id,
      stock ?? 0,
      isPopular ?? false
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: 'Producto creado',
        id: result.insertId
      });
    }
  );
});

/* ===============================
   OBTENER TODOS LOS PRODUCTOS
================================= */
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.*,
      c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.isActive = 1
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});
/* ===============================
   OBTENER PRODUCTOS POPULARES
================================= */
router.get('/popular', (req, res) => {
  const sql = `
    SELECT 
      p.*,
      c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.isPopular = 1 AND p.isActive = 1
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* ===============================
   OBTENER POR CATEGORÍA
================================= */
router.get('/category/:id', (req, res) => {
  const sql = `
    SELECT 
      p.*,
      c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.isActive = 1
  `;

  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* ===============================
   OBTENER PRODUCTO POR ID
================================= */
router.get('/:id', (req, res) => {
  const sql = `
    SELECT 
      p.*,
      c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;

  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows[0]);
  });
});

/* ===============================
   ACTUALIZAR PRODUCTO
================================= */
router.put('/:id', (req, res) => {
  const {
    name,
    description,
    price,
    image,
    category_id,
    stock,
    isPopular,
    isActive
  } = req.body;

  const sql = `
    UPDATE products SET
      name = ?,
      description = ?,
      price = ?,
      image = ?,
      category_id = ?,
      stock = ?,
      isPopular = ?,
      isActive = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      name,
      description,
      price,
      image,
      category_id,
      stock,
      isPopular,
      isActive,
      req.params.id
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Producto actualizado' });
    }
  );
});

/* ===============================
   ELIMINAR PRODUCTO (LÓGICO)
================================= */
router.delete('/:id', (req, res) => {
  db.query(
    'UPDATE products SET isActive = 0 WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Producto eliminado' });
    }
  );
});

module.exports = router;
