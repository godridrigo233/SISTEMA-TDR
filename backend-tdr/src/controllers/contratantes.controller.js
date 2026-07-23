const pool = require('../config/db');
const { registrar: auditLog } = require('./auditoria.controller');

// El middleware verifyToken (aplicado en contratantes.routes.js) ya decodifica
// el JWT y lo deja en req.user — evita re-decodificar aquí con un secreto
// duplicado que puede desincronizarse del real (JWT_SECRET de middleware/auth.js).
function getUsuario(req) {
  return req.user || null;
}

function validar(data) {
  const e = [];
  if (!data.nombres?.trim())                    e.push('nombres es requerido');
  if ((data.nombres?.length ?? 0) > 40)         e.push('nombres: máximo 40 caracteres');
  if (!data.primer_apellido?.trim())            e.push('primer_apellido es requerido');
  if ((data.primer_apellido?.length ?? 0) > 40) e.push('primer_apellido: máximo 40 caracteres');
  if (!data.segundo_apellido?.trim())           e.push('segundo_apellido es requerido');
  if ((data.segundo_apellido?.length ?? 0) > 40)e.push('segundo_apellido: máximo 40 caracteres');
  if (!['DNI','CE','PAS'].includes((data.tipo_documento||'').trim().toUpperCase()))
    e.push('tipo_documento debe ser DNI, CE o PAS');
  if (!/^\d{8}$/.test(data.numero_documento))
    e.push('DNI debe tener exactamente 8 dígitos');
  if (!data.correo_electronico || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo_electronico))
    e.push('correo_electronico inválido');
  if (data.ruc && !/^\d{11}$/.test(data.ruc))
    e.push('RUC debe tener 11 dígitos');
  if (data.cci && !/^\d{20}$/.test(data.cci))
    e.push('CCI debe tener 20 dígitos');
  return e;
}

// GET /api/contratantes/me
exports.getMiPerfil = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u) return res.status(401).json({ message: 'No autenticado' });

    const [rows] = await pool.query(
      `SELECT cp.*, u.username, u.rol
       FROM t_contratantes_perfil cp
       JOIN t_usuarios u ON u.id = cp.usuario_id
       WHERE cp.usuario_id = ?`,
      [u.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Perfil no encontrado.' });

    res.json(rows[0]);
  } catch (err) {
    console.error('[contratantes] getMiPerfil:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// PUT /api/contratantes/me
exports.upsertMiPerfil = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u) return res.status(401).json({ message: 'No autenticado' });

    const data = req.body;
    const errores = validar(data);
    if (errores.length > 0) return res.status(400).json({ errores });

    const tipo = data.tipo_documento.trim().toUpperCase().padEnd(3).slice(0, 3);

    await pool.query(
      `INSERT INTO t_contratantes_perfil
         (usuario_id, nombres, primer_apellido, segundo_apellido,
          tipo_documento, numero_documento, ruc,
          correo_electronico, telefono_celular, domicilio,
          lugar_nacimiento, fecha_nacimiento, estado_civil, nacionalidad,
          banco, cci)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT (usuario_id) DO UPDATE SET
         nombres            = EXCLUDED.nombres,
         primer_apellido    = EXCLUDED.primer_apellido,
         segundo_apellido   = EXCLUDED.segundo_apellido,
         tipo_documento     = EXCLUDED.tipo_documento,
         numero_documento   = EXCLUDED.numero_documento,
         ruc                = EXCLUDED.ruc,
         correo_electronico = EXCLUDED.correo_electronico,
         telefono_celular   = EXCLUDED.telefono_celular,
         domicilio          = EXCLUDED.domicilio,
         lugar_nacimiento   = EXCLUDED.lugar_nacimiento,
         fecha_nacimiento   = EXCLUDED.fecha_nacimiento,
         estado_civil       = EXCLUDED.estado_civil,
         nacionalidad       = EXCLUDED.nacionalidad,
         banco              = EXCLUDED.banco,
         cci                = EXCLUDED.cci`,
      [
        u.id,
        data.nombres.trim(),
        data.primer_apellido.trim(),
        data.segundo_apellido.trim(),
        tipo,
        data.numero_documento,
        data.ruc              || null,
        data.correo_electronico.trim().toLowerCase(),
        data.telefono_celular || null,
        data.domicilio        || null,
        data.lugar_nacimiento || null,
        data.fecha_nacimiento || null,
        data.estado_civil     || null,
        data.nacionalidad     || 'Peruana',
        data.banco            || null,
        data.cci              || null,
      ]
    );

    const [updated] = await pool.query(
      'SELECT * FROM t_contratantes_perfil WHERE usuario_id = ?', [u.id]
    );
    res.json({ message: 'Perfil guardado correctamente', perfil: updated[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Ese número de documento ya está registrado' });
    console.error('[contratantes] upsertMiPerfil:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// PUT /api/contratantes/me/password — cambio de contraseña
exports.cambiarPassword = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u) return res.status(401).json({ message: 'No autenticado' });

    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva)
      return res.status(400).json({ message: 'Debe ingresar la contraseña actual y la nueva contraseña' });
    if (passwordNueva.length < 6)
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    if (passwordActual === passwordNueva)
      return res.status(400).json({ message: 'La nueva contraseña debe ser diferente a la actual' });

    const [rows] = await pool.query(
      'SELECT password_hash FROM t_usuarios WHERE id = ?',
      [u.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    const bcrypt = require('bcrypt');
    const ok = await bcrypt.compare(passwordActual, rows[0].password_hash);
    if (!ok)
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });

    const nuevoHash = await bcrypt.hash(passwordNueva, 10);
    await pool.query(
      'UPDATE t_usuarios SET password_hash = ? WHERE id = ?',
      [nuevoHash, u.id]
    );

    auditLog({
      usuario: u,
      accion: 'CAMBIAR_PASSWORD',
      entidad: 't_usuarios',
      entidadId: u.id,
      descripcion: 'Contraseña actualizada',
      ip: req.ip,
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('[contratantes] cambiarPassword:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// GET /api/contratantes — solo ADMINISTRADORES
exports.getTodos = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u || u.rol !== 'ADMINISTRADOR')
      return res.status(403).json({ message: 'Solo administradores' });

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM t_contratantes_perfil'
    );

    const [rows] = await pool.query(
      `SELECT cp.*, u.username, u.rol
       FROM t_contratantes_perfil cp
       JOIN t_usuarios u ON u.id = cp.usuario_id
       ORDER BY cp.primer_apellido, cp.nombres
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[contratantes] getTodos:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// POST /api/contratantes — solo ADMINISTRADORES
exports.crearContratante = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u || u.rol !== 'ADMINISTRADOR')
      return res.status(403).json({ message: 'Solo administradores pueden crear contratantes' });

    const data = req.body;

    if (!data.username?.trim())
      return res.status(400).json({ message: 'username es requerido' });
    if (!data.password || data.password.length < 6)
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });

    const errores = validar(data);
    if (errores.length > 0) return res.status(400).json({ errores });

    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(data.password, 10);

    // 1. Credenciales + rol → t_usuarios
    const [uResult] = await pool.query(
      `INSERT INTO t_usuarios (username, password_hash, rol)
       VALUES (?, ?, 'CONTRATANTE')`,
      [data.username.trim(), password_hash]
    );
    const nuevoUsuarioId = uResult.insertId;

    // 2. Datos personales → t_contratantes_perfil (sin username ni password)
    const tipo = data.tipo_documento.trim().toUpperCase().padEnd(3).slice(0, 3);
    await pool.query(
      `INSERT INTO t_contratantes_perfil
         (usuario_id, nombres, primer_apellido, segundo_apellido,
          tipo_documento, numero_documento, ruc,
          correo_electronico, telefono_celular, domicilio,
          lugar_nacimiento, fecha_nacimiento, estado_civil, nacionalidad,
          banco, cci)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        nuevoUsuarioId,
        data.nombres.trim(),
        data.primer_apellido.trim(),
        data.segundo_apellido.trim(),
        tipo,
        data.numero_documento,
        data.ruc              || null,
        data.correo_electronico.trim().toLowerCase(),
        data.telefono_celular || null,
        data.domicilio        || null,
        data.lugar_nacimiento || null,
        data.fecha_nacimiento || null,
        data.estado_civil     || null,
        data.nacionalidad     || 'Peruana',
        data.banco            || null,
        data.cci              || null,
      ]
    );

    res.status(201).json({ message: 'Contratante creado correctamente' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Ese nombre de usuario o documento ya existe' });
    console.error('[contratantes] crearContratante:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// GET /api/contratantes/:id — solo ADMINISTRADORES
exports.getPorId = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u || u.rol !== 'ADMINISTRADOR')
      return res.status(403).json({ message: 'Solo administradores' });

    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT cp.*, u.username, u.rol
       FROM t_contratantes_perfil cp
       JOIN t_usuarios u ON u.id = cp.usuario_id
       WHERE cp.usuario_id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Contratante no encontrado' });

    res.json(rows[0]);
  } catch (err) {
    console.error('[contratantes] getPorId:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};

// PUT /api/contratantes/:id — solo ADMINISTRADORES (edita el perfil de otro usuario)
exports.actualizarContratante = async (req, res) => {
  try {
    const u = getUsuario(req);
    if (!u || u.rol !== 'ADMINISTRADOR')
      return res.status(403).json({ message: 'Solo administradores pueden editar contratantes' });

    const { id } = req.params;
    const data = req.body;
    const errores = validar(data);
    if (errores.length > 0) return res.status(400).json({ errores });

    const tipo = data.tipo_documento.trim().toUpperCase().padEnd(3).slice(0, 3);

    const [result] = await pool.query(
      `UPDATE t_contratantes_perfil SET
         nombres            = ?,
         primer_apellido    = ?,
         segundo_apellido   = ?,
         tipo_documento     = ?,
         numero_documento   = ?,
         ruc                = ?,
         correo_electronico = ?,
         telefono_celular   = ?,
         domicilio          = ?,
         lugar_nacimiento   = ?,
         fecha_nacimiento   = ?,
         estado_civil       = ?,
         nacionalidad       = ?,
         banco              = ?,
         cci                = ?
       WHERE usuario_id = ?`,
      [
        data.nombres.trim(),
        data.primer_apellido.trim(),
        data.segundo_apellido.trim(),
        tipo,
        data.numero_documento,
        data.ruc              || null,
        data.correo_electronico.trim().toLowerCase(),
        data.telefono_celular || null,
        data.domicilio        || null,
        data.lugar_nacimiento || null,
        data.fecha_nacimiento || null,
        data.estado_civil     || null,
        data.nacionalidad     || 'Peruana',
        data.banco            || null,
        data.cci              || null,
        id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Contratante no encontrado' });

    res.json({ message: 'Contratante actualizado correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Ese número de documento ya está registrado' });
    console.error('[contratantes] actualizarContratante:', err.message);
    res.status(500).json({ message: 'Error interno' });
  }
};