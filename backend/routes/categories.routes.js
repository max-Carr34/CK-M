const express = require('express');
const router = express.Router();
const db = require('../db');

/* ===============================
   OBTENER CATEGORÍAS ACTIVAS
================================= */
router.get('/', (req, res) => {
  db.query(
    'SELECT * FROM categories WHERE isActive = 1',
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* ===============================
   CREAR CATEGORÍA (ADMIN)
================================= */
router.post('/', (req, res) => {
  const { name } = req.body;

  db.query(
    'INSERT INTO categories (name, isActive) VALUES (?, 1)',
    [name],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        message: 'Categoría creada',
        id: result.insertId
      });
    }
  );
});

/* ===============================
   DESACTIVAR CATEGORÍA
================================= */
router.delete('/:id', (req, res) => {
  db.query(
    'UPDATE categories SET isActive = 0 WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Categoría eliminada' });
    }
  );
});

module.exports = router;
