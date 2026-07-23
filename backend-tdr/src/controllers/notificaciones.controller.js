const pool = require('../config/db');

/**
 * Crea una notificación para un usuario.
 */
async function crearNotificacion({ usuarioId, titulo, mensaje, tdrId, tipo }) {
  try {
    await pool.query(
      `INSERT INTO t_notificaciones (usuario_id, titulo, mensaje, tdr_id, tipo)
       VALUES (?, ?, ?, ?, ?)`,
      [usuarioId, titulo, mensaje || null, tdrId || null, tipo || 'general']
    );
  } catch (err) {
    console.error('[notificaciones] Error creando:', err.message);
  }
}

// GET /api/notificaciones — notificaciones del usuario autenticado
exports.getMisNotificaciones = async (req, res) => {
  try {
    const u = req.user;
    if (!u) return res.status(401).json({ message: 'No autenticado' });

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const [rows] = await pool.query(
      `SELECT n.*, t.codigo_unico AS tdr_codigo
       FROM t_notificaciones n
       LEFT JOIN t_tdrs t ON n.tdr_id = t.id
       WHERE n.usuario_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [u.id, limit]
    );

    const [[{ noLeidas }]] = await pool.query(
      'SELECT COUNT(*) AS noLeidas FROM t_notificaciones WHERE usuario_id = ? AND leida = FALSE',
      [u.id]
    );

    res.json({ notificaciones: rows, noLeidas });
  } catch (err) {
    console.error('[notificaciones] getMisNotificaciones:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// PUT /api/notificaciones/:id/leer — marcar como leída
exports.marcarLeida = async (req, res) => {
  try {
    const u = req.user;
    if (!u) return res.status(401).json({ message: 'No autenticado' });

    await pool.query(
      'UPDATE t_notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?',
      [req.params.id, u.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[notificaciones] marcarLeida:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// PUT /api/notificaciones/leer-todas — marcar todas como leídas
exports.marcarTodasLeidas = async (req, res) => {
  try {
    const u = req.user;
    if (!u) return res.status(401).json({ message: 'No autenticado' });

    await pool.query(
      'UPDATE t_notificaciones SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE',
      [u.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[notificaciones] marcarTodasLeidas:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.crearNotificacion = crearNotificacion;
