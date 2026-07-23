const pool = require('../config/db');

/**
 * Registra una entrada de auditoría.
 * @param {object} params
 * @param {object} params.usuario - req.user (del JWT decodificado)
 * @param {string} params.accion  - Ej: 'CREAR_TDR', 'VALIDAR_TDR', 'LOGIN'
 * @param {string} params.entidad - Ej: 't_tdrs', 't_usuarios'
 * @param {string} params.entidadId - ID del registro afectado
 * @param {string} params.descripcion - Texto legible de la acción
 * @param {string} params.ip - IP del cliente
 */
async function registrar({ usuario, accion, entidad, entidadId, descripcion, ip }) {
  try {
    await pool.query(
      `INSERT INTO t_auditoria (usuario_id, username, rol, accion, entidad, entidad_id, descripcion, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario?.id || null,
        usuario?.username || null,
        usuario?.rol || null,
        accion,
        entidad || null,
        entidadId ? String(entidadId) : null,
        descripcion || null,
        ip || null,
      ]
    );
  } catch (err) {
    console.error('[auditoria] Error registrando:', err.message);
  }
}

// GET /api/auditoria — solo ADMINISTRADORES
exports.getAuditoria = async (req, res) => {
  try {
    if (!req.user || req.user.rol !== 'ADMINISTRADOR')
      return res.status(403).json({ message: 'Solo administradores' });

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (req.query.usuario?.trim()) {
      where.push('a.username ILIKE ?');
      params.push(`%${req.query.usuario.trim()}%`);
    }
    if (req.query.accion?.trim()) {
      where.push('a.accion = ?');
      params.push(req.query.accion.trim());
    }
    if (req.query.entidad?.trim()) {
      where.push('a.entidad = ?');
      params.push(req.query.entidad.trim());
    }
    if (req.query.desde?.trim()) {
      where.push('a.created_at >= ?');
      params.push(req.query.desde.trim());
    }
    if (req.query.hasta?.trim()) {
      where.push("a.created_at < (?::date + interval '1 day')");
      params.push(req.query.hasta.trim());
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM t_auditoria a ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT a.*
       FROM t_auditoria a
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[auditoria] getAuditoria:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.registrar = registrar;
