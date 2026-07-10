// src/routes/maestros.routes.js
// Rutas para tablas maestras: equipos y periodos
const { Router } = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const router = Router();

router.use(verifyToken);

// GET /api/maestros/equipos
router.get('/equipos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM m_equipos ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    console.error('[maestros] equipos:', err.message);
    res.status(500).json({ message: 'Error obteniendo equipos' });
  }
});

// GET /api/maestros/periodos
router.get('/periodos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, anio, mes, nombre_mes FROM m_periodos ORDER BY anio DESC, mes ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[maestros] periodos:', err.message);
    res.status(500).json({ message: 'Error obteniendo periodos' });
  }
});

module.exports = router;