const pool = require('../config/db');

// Obtener la plantilla actual
exports.getPlantilla = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM m_plantilla_tdr LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ message: "No hay plantilla configurada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error obteniendo plantilla:", error);
    res.status(500).json({ message: "Error obteniendo plantilla" });
  }
};

// Actualizar la plantilla
exports.updatePlantilla = async (req, res) => {
  try {
    const { 
      titulo, objeto, finalidad, perfil, actividades, 
      entregables, plazo, formaPago, penalidades, conformidad 
    } = req.body;

    await pool.query(`
      UPDATE m_plantilla_tdr 
      SET 
        titulo = ?, objeto = ?, finalidad = ?, perfil = ?, 
        actividades = ?, entregables = ?, plazo = ?, 
        formaPago = ?, penalidades = ?, conformidad = ?
      WHERE id = 1
    `, [titulo, objeto, finalidad, perfil, actividades, entregables, plazo, formaPago, penalidades, conformidad]);

    res.json({ message: "Plantilla actualizada correctamente" });
  } catch (error) {
    console.error("Error actualizando plantilla:", error);
    res.status(500).json({ message: "Error actualizando plantilla" });
  }
};