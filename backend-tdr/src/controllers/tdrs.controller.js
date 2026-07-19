const pool = require('../config/db');
const { uploadDocumento, getSignedUrl } = require('../config/storage');

// ===============================
// 🔹 VALIDAR DATOS DE TDR (crear/editar)
// ===============================
function validarDatosTdr(body, { esNuevo }) {
  const errores = [];

  if (!body.codigo?.trim())                    errores.push('El código del TdR es obligatorio');
  if (!body.equipoId)                           errores.push('Debe seleccionar un equipo solicitante');
  if (!body.denominacionConvocatoria?.trim())   errores.push('La denominación del servicio es obligatoria');
  if (!body.descripcionServicio?.trim())        errores.push('La descripción del servicio es obligatoria');
  if (!body.finalidadPublica?.trim())           errores.push('La finalidad pública es obligatoria');
  if (!body.nivelFormacionRequerido?.trim())    errores.push('El nivel de formación requerido es obligatorio');

  const plazo = Number(body.plazoEjecucionDias);
  if (!body.plazoEjecucionDias || isNaN(plazo) || plazo <= 0)
    errores.push('El plazo de ejecución debe ser un número mayor a 0');

  const honorarios = Number(body.totalHonorarios);
  if (!body.totalHonorarios || isNaN(honorarios) || honorarios <= 0)
    errores.push('El honorario total debe ser un número mayor a 0');

  const armadas = Number(body.numeroArmadas);
  if (!body.numeroArmadas || isNaN(armadas) || armadas <= 0)
    errores.push('El número de armadas debe ser mayor a 0');

  let periodo = {};
  try { periodo = JSON.parse(body.periodo || '{}'); } catch { errores.push('Periodo inválido'); }
  if (!periodo.año || !periodo.mes) errores.push('Debe seleccionar el periodo (mes y año)');

  if (esNuevo) {
    if (body.esNuevoLocador !== 'true' && !body.locadorId)
      errores.push('Debe seleccionar un locador o registrar uno nuevo');

    if (body.esNuevoLocador === 'true') {
      let locadorData = {};
      try { locadorData = JSON.parse(body.locadorData || '{}'); } catch { errores.push('Datos de locador inválidos'); }
      if (!locadorData.nombres?.trim())          errores.push('El nombre del locador es obligatorio');
      if (!locadorData.apellidos?.trim())        errores.push('El apellido del locador es obligatorio');
      if (!locadorData.numeroDocumento?.trim())  errores.push('El número de documento del locador es obligatorio');
      if (locadorData.ruc && !/^\d{11}$/.test(locadorData.ruc))
        errores.push('El RUC del locador debe tener 11 dígitos');
    }
  }

  return errores;
}

// ===============================
// 🔹 LISTAR TDRs
// ===============================
exports.getTdrs = async (req, res) => {

  try {

    const { search, estado, equipoId, periodoId, page, pageSize, fechaDesde, fechaHasta, contratante } = req.query;

    const where = [];
    const params = [];

    // Un CONTRATANTE solo ve los TDR que él mismo creó.
    if (req.user?.rol === 'CONTRATANTE') {
      where.push('t.usuario_creador_id = ?');
      params.push(req.user.id);
    }

    if (search?.trim()) {
      where.push('(t.codigo_unico ILIKE ? OR t.denominacion ILIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (estado?.trim()) {
      where.push('t.estado_verificacion = ?');
      params.push(estado.trim());
    }

    if (equipoId) {
      where.push('t.equipo_id = ?');
      params.push(equipoId);
    }

    if (periodoId) {
      where.push('t.periodo_id = ?');
      params.push(periodoId);
    }

    if (fechaDesde?.trim()) {
      where.push("t.created_at >= ?");
      params.push(fechaDesde.trim());
    }

    if (fechaHasta?.trim()) {
      where.push("t.created_at < (? ::date + interval '1 day')");
      params.push(fechaHasta.trim());
    }

    // Solo ADMIN/ADMINISTRATIVO pueden filtrar por contratante
    if (contratante?.trim() && req.user?.rol !== 'CONTRATANTE') {
      where.push("(cp.nombres ILIKE ? OR cp.primer_apellido ILIKE ? OR cp.segundo_apellido ILIKE ?)");
      params.push(`%${contratante.trim()}%`, `%${contratante.trim()}%`, `%${contratante.trim()}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM t_tdrs t
       LEFT JOIN t_contratantes_perfil cp ON t.usuario_creador_id = cp.usuario_id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const size = Math.min(Math.max(parseInt(pageSize) || 0, 0), 200) || total || 1;
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const offset = (currentPage - 1) * size;

    const usePagination = !!(page || pageSize);

    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.codigo_unico,
        t.denominacion,
        t.estado_verificacion,
        t.created_at,
        e.nombre AS equipo_nombre,
        p.nombre_mes,
        p.anio,
        cp.nombres            AS cnt_nombres,
        cp.primer_apellido    AS cnt_primer_apellido,
        cp.segundo_apellido   AS cnt_segundo_apellido,
        (
          SELECT h.comentario
          FROM t_tdr_historial_validaciones h
          WHERE h.tdr_id = t.id
            AND h.accion = 'Observacion'
          ORDER BY h.created_at DESC
          LIMIT 1
        ) AS ultima_observacion
      FROM t_tdrs t
      INNER JOIN m_equipos e ON t.equipo_id = e.id
      INNER JOIN m_periodos p ON t.periodo_id = p.id
      LEFT JOIN t_contratantes_perfil cp ON t.usuario_creador_id = cp.usuario_id
      ${whereSql}
      ORDER BY t.id DESC
      ${usePagination ? 'LIMIT ? OFFSET ?' : ''}
    `, usePagination ? [...params, size, offset] : params);

    const formatted = rows.map(row => ({
      id: String(row.id),
      codigo: row.codigo_unico,
      denominacion: row.denominacion,
      equipoSolicitante: row.equipo_nombre,
      periodo: { mes: row.nombre_mes, año: row.anio },
      estado: row.estado_verificacion,
      created_at: row.created_at,
      contratante: row.cnt_nombres
        ? `${row.cnt_nombres} ${row.cnt_primer_apellido ?? ''} ${row.cnt_segundo_apellido ?? ''}`.trim()
        : null,
      ultima_observacion: row.ultima_observacion || null
    }));

    if (usePagination) {
      return res.json({ data: formatted, total, page: currentPage, pageSize: size });
    }

    res.json(formatted);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo TDRs"
    });

  }

};

// ===============================
// 🔹 OBTENER TDR POR ID
// ===============================
exports.getTdrById = async (req, res) => {
  try {
    const { id } = req.params;

    const [tdrRows] = await pool.query(`
      SELECT
        t.*,
        e.nombre     AS equipo_nombre,
        p.nombre_mes,
        p.anio,
        u.username   AS creado_por_username,

        cp.nombres            AS cnt_nombres,
        cp.primer_apellido    AS cnt_primer_apellido,
        cp.segundo_apellido   AS cnt_segundo_apellido,
        cp.correo_electronico AS cnt_correo_electronico,
        cp.telefono_celular   AS cnt_telefono_celular,
        cp.numero_documento   AS cnt_numero_documento,
        cp.ruc                AS cnt_ruc,
        cp.domicilio          AS cnt_domicilio,
        cp.banco              AS cnt_banco,
        cp.cci                AS cnt_cci,
        cp.tipo_documento     AS cnt_tipo_documento,
        cp.lugar_nacimiento   AS cnt_lugar_nacimiento,
        cp.fecha_nacimiento   AS cnt_fecha_nacimiento,
        cp.estado_civil       AS cnt_estado_civil,
        cp.nacionalidad       AS cnt_nacionalidad

      FROM t_tdrs t
      LEFT JOIN m_equipos             e  ON t.equipo_id          = e.id
      LEFT JOIN m_periodos            p  ON t.periodo_id          = p.id
      LEFT JOIN t_usuarios            u  ON t.usuario_creador_id  = u.id
      LEFT JOIN t_contratantes_perfil cp ON t.usuario_creador_id  = cp.usuario_id
      WHERE t.id = ?
    `, [id]);

    if (tdrRows.length === 0)
      return res.status(404).json({ message: 'TDR no encontrado' });

    const tdr = tdrRows[0];

    // Un CONTRATANTE solo puede ver los TDR que él mismo creó.
    if (req.user?.rol === 'CONTRATANTE' && tdr.usuario_creador_id !== req.user.id) {
      return res.status(403).json({ message: 'No tiene permisos para ver este TDR' });
    }

    const [locadorRows] = await pool.query(
      'SELECT * FROM m_locadores WHERE id = ?',
      [tdr.locador_id]
    );

    const contratante = tdr.cnt_nombres ? {
      nombres:            tdr.cnt_nombres,
      primer_apellido:    tdr.cnt_primer_apellido,
      segundo_apellido:   tdr.cnt_segundo_apellido,
      apellidos:          [tdr.cnt_primer_apellido, tdr.cnt_segundo_apellido]
                            .filter(Boolean).join(' '),
      correo_electronico: tdr.cnt_correo_electronico,
      telefono_celular:   tdr.cnt_telefono_celular,
      numero_documento:   tdr.cnt_numero_documento,
      tipo_documento:     tdr.cnt_tipo_documento?.trim(),
      ruc:                tdr.cnt_ruc,
      domicilio:          tdr.cnt_domicilio,
      banco:              tdr.cnt_banco,
      cci:                tdr.cnt_cci,
      lugar_nacimiento:   tdr.cnt_lugar_nacimiento,
      fecha_nacimiento:   tdr.cnt_fecha_nacimiento,
      estado_civil:       tdr.cnt_estado_civil,
      nacionalidad:       tdr.cnt_nacionalidad || 'Peruana',
      username:           tdr.creado_por_username,
    } : null;

    Object.keys(tdr)
      .filter(k => k.startsWith('cnt_') || k === 'creado_por_username')
      .forEach(k => delete tdr[k]);

    const [formacion] = await pool.query(
      'SELECT * FROM t_locador_formacion WHERE locador_id = ?',
      [tdr.locador_id]
    );
    const [experiencia] = await pool.query(
      'SELECT * FROM t_locador_experiencia WHERE locador_id = ?',
      [tdr.locador_id]
    );
    const [certificaciones] = await pool.query(
      'SELECT * FROM t_locador_certificaciones WHERE locador_id = ?',
      [tdr.locador_id]
    ).catch(() => [[]]);

    const [actividades] = await pool.query(
      'SELECT * FROM t_tdr_actividades WHERE tdr_id = ?', [id]
    );
    const [entregables] = await pool.query(
      'SELECT * FROM t_tdr_entregables WHERE tdr_id = ?', [id]
    );
    const [documentosRows] = await pool.query(
      'SELECT tipo_documento, ruta_archivo FROM t_locador_documentos WHERE tdr_id = ?', [id]
    );
    const [validaciones] = await pool.query(
      'SELECT * FROM t_tdr_historial_validaciones WHERE tdr_id = ? ORDER BY created_at ASC', [id]
    );

    const documentos = {};
    for (const doc of documentosRows) {
      const url = await getSignedUrl(doc.ruta_archivo);
      if (doc.tipo_documento === 'CV_DOCUMENTADO') documentos.cv  = url;
      if (doc.tipo_documento === 'DNI_CE')         documentos.dni = url;
      if (doc.tipo_documento === 'RNP')            documentos.rnp = url;
      if (doc.tipo_documento === 'RUC')            documentos.ruc = url;
    }

    res.json({
      ...tdr,
      locador:      locadorRows[0] || null,
      contratante,
      formacion,
      experiencia,
      certificaciones,
      actividades,
      entregables,
      documentos,
      validaciones,
    });

  } catch (error) {
    console.error('Error obteniendo TDR:', error);
    res.status(500).json({ message: 'Error obteniendo TDR' });
  }
};

// ===============================
// 🔹 OBTENER TDRs POR LOCADOR
// ===============================
exports.getTdrsByLocador = async (req, res) => {

  try {

    const { locadorId } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        t.id,
        t.codigo_unico,
        t.denominacion,
        t.estado_verificacion,
        e.nombre AS equipo_nombre,
        p.nombre_mes,
        p.anio
      FROM t_tdrs t
      INNER JOIN m_equipos e ON t.equipo_id = e.id
      INNER JOIN m_periodos p ON t.periodo_id = p.id
      WHERE t.locador_id = ?
      ORDER BY t.id DESC
    `,[locadorId]);

    const formatted = rows.map(row => ({
      id: String(row.id),
      codigo: row.codigo_unico,
      denominacion: row.denominacion,
      equipoSolicitante: row.equipo_nombre,
      periodo: {
        mes: row.nombre_mes,
        año: row.anio
      },
      estado: row.estado_verificacion
    }));

    res.json(formatted);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:"Error obteniendo TDRs del locador"
    });

  }

};

// ===============================
// 🔹 CREAR TDR
// ===============================
exports.createTdr = async (req, res) => {

  const errores = validarDatosTdr(req.body, { esNuevo: true });
  if (errores.length > 0) {
    return res.status(400).json({ message: 'Datos incompletos', errores });
  }

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    const {
      codigo,
      locadorId,
      equipoId,
      denominacionConvocatoria,
      descripcionServicio,
      finalidadPublica,
      nivelFormacionRequerido,
      tituloObtenidoRequerido,
      capacitacionRequerida,
      plazoEjecucionDias,
      totalHonorarios,
      numeroArmadas,
      usuarioCreadorId,
      esNuevoLocador
    } = req.body;

    const periodo     = JSON.parse(req.body.periodo     || "{}");
    const actividades = JSON.parse(req.body.actividades || "[]");
    const entregables = JSON.parse(req.body.entregables || "[]");
    const locadorData = JSON.parse(req.body.locadorData || "{}");
    const formacion   = JSON.parse(req.body.formacion   || "[]");
    const experiencias= JSON.parse(req.body.experiencias|| "[]");

    // ── Locador ──────────────────────────────────────────────────────
    let locadorFinalId = locadorId;

    if (esNuevoLocador === "true") {

      const [existe] = await connection.query(
        "SELECT id FROM m_locadores WHERE numero_documento = ?",
        [locadorData.numeroDocumento]
      );

      if (existe.length > 0) {
        locadorFinalId = existe[0].id;
      } else {
        const [nuevo] = await connection.query(`
          INSERT INTO m_locadores
          (apellidos, nombres, tipo_documento, numero_documento,
           ruc, domicilio, telefono_celular, correo_electronico,
           fecha_nacimiento, cci, genero, estado_civil, nacionalidad,
           lugar_nacimiento, banco)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          locadorData.apellidos,
          locadorData.nombres,
          locadorData.tipoDocumento,
          locadorData.numeroDocumento,
          locadorData.ruc,
          locadorData.domicilio,
          locadorData.telefonoCelular,
          locadorData.correo,
          locadorData.fechaNacimiento,
          locadorData.cci,
          locadorData.genero,
          locadorData.estadoCivil,
          locadorData.nacionalidad,
          locadorData.lugarNacimiento,
          locadorData.banco
        ]);
        locadorFinalId = nuevo.insertId;
      }
    }

    // ── Formación ─────────────────────────────────────────────────────
    for (const f of formacion) {
      await connection.query(`
        INSERT INTO t_locador_formacion
        (locador_id, centro_estudios, especialidad, grado_obtenido, ciudad, fecha_inicio, fecha_fin)
        VALUES (?,?,?,?,?,?,?)
      `, [
        locadorFinalId,
        f.centroEstudios || "",
        f.especialidad   || "",
        f.gradoObtenido  || "",
        f.ciudad         || "",
        f.fechaInicio    || null,
        f.fechaFin       || null
      ]);
    }

    // ── Experiencia ───────────────────────────────────────────────────
    for (const exp of experiencias) {
      await connection.query(`
        INSERT INTO t_locador_experiencia
        (locador_id, tipo_experiencia, entidad_empresa, cargo, descripcion_trabajo, fecha_inicio, fecha_fin)
        VALUES (?,?,?,?,?,?,?)
      `, [
        locadorFinalId,
        exp.tipoExperiencia  || "General",
        exp.nombreEntidad    || "",
        exp.cargo            || "",
        exp.descripcionTrabajo || "",
        exp.fechaInicio      || null,
        exp.fechaFin         || null
      ]);
    }

    // ── Periodo ───────────────────────────────────────────────────────
    const [periodoRows] = await connection.query(
      "SELECT id FROM m_periodos WHERE anio=? AND nombre_mes=?",
      [periodo.año, periodo.mes]
    );
    if (periodoRows.length === 0) throw new Error("Periodo no encontrado");
    const periodo_id = periodoRows[0].id;

    // ── Insertar TDR ──────────────────────────────────────────────────
    const [result] = await connection.query(`
      INSERT INTO t_tdrs
      (codigo_unico, locador_id, equipo_id, periodo_id,
       usuario_creador_id, denominacion, objetivo, finalidad_publica,
       nivel_formacion_requerido, titulo_obtenido_requerido, capacitacion_requerida,
       plazo_ejecucion, honorario_total, total_armadas)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      codigo,
      locadorFinalId,
      equipoId,
      periodo_id,
      usuarioCreadorId,
      denominacionConvocatoria,
      descripcionServicio,
      finalidadPublica,
      nivelFormacionRequerido || null,
      tituloObtenidoRequerido || null,
      capacitacionRequerida   || null,
      plazoEjecucionDias,
      totalHonorarios,
      numeroArmadas
    ]);

    const tdrId = result.insertId;

    // ── Actividades ───────────────────────────────────────────────────
    for (const act of actividades) {
      await connection.query(
        "INSERT INTO t_tdr_actividades (tdr_id, descripcion) VALUES (?,?)",
        [tdrId, act.descripcion]
      );
    }

    // ── Entregables ───────────────────────────────────────────────────
    for (const ent of entregables) {
      await connection.query(`
        INSERT INTO t_tdr_entregables
        (tdr_id, nro_armada, descripcion, fecha_inicio, fecha_fin, monto_pago)
        VALUES (?,?,?,?,?,?)
      `, [
        tdrId,
        ent.armada,
        ent.descripcion,
        ent.fechaInicioArmada,
        ent.fechaFinArmada,
        ent.monto
      ]);
    }

    // ── Documentos ────────────────────────────────────────────────────
    if (req.files) {
      const documentos = [
        { key: "dniFile", tipo: "DNI_CE" },
        { key: "rnpFile", tipo: "RNP" },
        { key: "rucFile", tipo: "RUC" },
        { key: "cvFile",  tipo: "CV_DOCUMENTADO" }
      ];
      for (const doc of documentos) {
        if (req.files[doc.key]) {
          const file = req.files[doc.key][0];
          const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'pdf';
          const storagePath = `locador_${locadorFinalId}/${doc.tipo}_${Date.now()}.${ext}`;
          await uploadDocumento(file.buffer, storagePath, file.mimetype);
          await connection.query(`
            INSERT INTO t_locador_documentos
            (locador_id, tdr_id, tipo_documento, ruta_archivo)
            VALUES (?,?,?,?)
          `, [locadorFinalId, tdrId, doc.tipo, storagePath]);
        }
      }
    }

    await connection.commit();
    res.json({ message: "TDR creado correctamente", id: tdrId });

  } catch (error) {
    await connection.rollback();
    console.error("Error creando TDR:", error);
    res.status(500).json({ message: error.message || "Error interno" });
  } finally {
    connection.release();
  }
};

// ===============================
// 🔹 ACTUALIZAR TDR
// ===============================
exports.updateTdr = async (req, res) => {
  const errores = validarDatosTdr(req.body, { esNuevo: false });
  if (errores.length > 0) {
    return res.status(400).json({ message: 'Datos incompletos', errores });
  }

  const { id } = req.params;

  // Un CONTRATANTE solo puede editar los TDR que él mismo creó.
  if (req.user?.rol === 'CONTRATANTE') {
    const [ownerRows] = await pool.query(
      'SELECT usuario_creador_id FROM t_tdrs WHERE id = ?', [id]
    );
    if (ownerRows.length === 0)
      return res.status(404).json({ message: 'TDR no encontrado' });
    if (ownerRows[0].usuario_creador_id !== req.user.id)
      return res.status(403).json({ message: 'No tiene permisos para editar este TDR' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      codigo,
      equipoId,
      denominacionConvocatoria,
      descripcionServicio,
      finalidadPublica,
      nivelFormacionRequerido,
      tituloObtenidoRequerido,
      capacitacionRequerida,
      plazoEjecucionDias,
      totalHonorarios,
      numeroArmadas,
      usuarioCreadorId
    } = req.body;

    const periodo     = JSON.parse(req.body.periodo     || "{}");
    const actividades = JSON.parse(req.body.actividades || "[]");
    const entregables = JSON.parse(req.body.entregables || "[]");
    const formacion   = JSON.parse(req.body.formacion   || "[]");
    const experiencias= JSON.parse(req.body.experiencias|| "[]");

    // ── Periodo ───────────────────────────────────────────────────────
    const [periodoRows] = await connection.query(
      "SELECT id FROM m_periodos WHERE anio=? AND nombre_mes=?",
      [periodo.año, periodo.mes]
    );
    if (periodoRows.length === 0) throw new Error("Periodo no encontrado en la base de datos.");
    const periodo_id = periodoRows[0].id;

    // ── Actualizar TDR → Pendiente ────────────────────────────────────
    await connection.query(`
      UPDATE t_tdrs SET
        codigo_unico              = ?,
        equipo_id                 = ?,
        periodo_id                = ?,
        denominacion              = ?,
        objetivo                  = ?,
        finalidad_publica         = ?,
        nivel_formacion_requerido = ?,
        titulo_obtenido_requerido = ?,
        capacitacion_requerida    = ?,
        plazo_ejecucion           = ?,
        honorario_total           = ?,
        total_armadas             = ?,
        estado_verificacion       = 'Pendiente'
      WHERE id = ?
    `, [
      codigo, equipoId, periodo_id, denominacionConvocatoria,
      descripcionServicio, finalidadPublica,
      nivelFormacionRequerido || null, tituloObtenidoRequerido || null, capacitacionRequerida || null,
      plazoEjecucionDias, totalHonorarios, numeroArmadas, id
    ]);

    // ── Historial de edición ──────────────────────────────────────────
    if (usuarioCreadorId) {
      await connection.query(`
        INSERT INTO t_tdr_historial_validaciones
        (tdr_id, usuario_admin_id, accion, estado_resultante, comentario)
        VALUES (?, ?, 'Edicion', 'Pendiente', 'El contratante ha editado y actualizado el TdR para una nueva revisión.')
      `, [id, usuarioCreadorId]);
    }

    // ── Locador asociado ──────────────────────────────────────────────
    const [tdrInfo] = await connection.query("SELECT locador_id FROM t_tdrs WHERE id=?", [id]);
    const locadorId = tdrInfo[0].locador_id;

    // ── Formación ─────────────────────────────────────────────────────
    await connection.query("DELETE FROM t_locador_formacion WHERE locador_id = ?", [locadorId]);
    for (const f of formacion) {
      await connection.query(`
        INSERT INTO t_locador_formacion
        (locador_id, centro_estudios, especialidad, grado_obtenido, ciudad, fecha_inicio, fecha_fin)
        VALUES (?,?,?,?,?,?,?)
      `, [
        locadorId,
        f.centroEstudios || "",
        f.especialidad   || "",
        f.gradoObtenido  || "",
        f.ciudad         || "",
        f.fechaInicio    || null,
        f.fechaFin       || null
      ]);
    }

    // ── Experiencia ───────────────────────────────────────────────────
    await connection.query("DELETE FROM t_locador_experiencia WHERE locador_id = ?", [locadorId]);
    for (const exp of experiencias) {
      await connection.query(`
        INSERT INTO t_locador_experiencia
        (locador_id, tipo_experiencia, entidad_empresa, cargo, descripcion_trabajo, fecha_inicio, fecha_fin)
        VALUES (?,?,?,?,?,?,?)
      `, [
        locadorId,
        exp.tipoExperiencia    || "General",
        exp.nombreEntidad      || "",
        exp.cargo              || "",
        exp.descripcionTrabajo || "",
        exp.fechaInicio        || null,
        exp.fechaFin           || null
      ]);
    }

    // ── Actividades ───────────────────────────────────────────────────
    await connection.query("DELETE FROM t_tdr_actividades WHERE tdr_id = ?", [id]);
    for (const act of actividades) {
      await connection.query(
        "INSERT INTO t_tdr_actividades (tdr_id, descripcion) VALUES (?,?)",
        [id, act.descripcion]
      );
    }

    // ── Entregables ───────────────────────────────────────────────────
    await connection.query("DELETE FROM t_tdr_entregables WHERE tdr_id = ?", [id]);
    for (const ent of entregables) {
      await connection.query(`
        INSERT INTO t_tdr_entregables
        (tdr_id, nro_armada, descripcion, fecha_inicio, fecha_fin, monto_pago)
        VALUES (?,?,?,?,?,?)
      `, [
        id, ent.armada, ent.descripcion,
        ent.fechaInicioArmada, ent.fechaFinArmada, ent.monto
      ]);
    }

    // ── Documentos ────────────────────────────────────────────────────
    if (req.files) {
      const documentosTipos = [
        { key: "dniFile", tipo: "DNI_CE" },
        { key: "rnpFile", tipo: "RNP" },
        { key: "rucFile", tipo: "RUC" },
        { key: "cvFile",  tipo: "CV_DOCUMENTADO" }
      ];
      for (const doc of documentosTipos) {
        if (req.files[doc.key]) {
          const file = req.files[doc.key][0];
          const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'pdf';
          const storagePath = `locador_${locadorId}/${doc.tipo}_${Date.now()}.${ext}`;
          await uploadDocumento(file.buffer, storagePath, file.mimetype);

          const [existeDoc] = await connection.query(
            "SELECT id FROM t_locador_documentos WHERE tdr_id = ? AND tipo_documento = ?",
            [id, doc.tipo]
          );
          if (existeDoc.length > 0) {
            await connection.query(
              "UPDATE t_locador_documentos SET ruta_archivo = ? WHERE id = ?",
              [storagePath, existeDoc[0].id]
            );
          } else {
            await connection.query(`
              INSERT INTO t_locador_documentos
              (locador_id, tdr_id, tipo_documento, ruta_archivo)
              VALUES (?,?,?,?)
            `, [locadorId, id, doc.tipo, storagePath]);
          }
        }
      }
    }

    await connection.commit();
    res.json({ message: "TDR actualizado correctamente" });

  } catch (error) {
    await connection.rollback();
    console.error("🔥 ERROR EN UPDATETDR:", error);
    res.status(500).json({ message: error.message || "Error actualizando TDR" });
  } finally {
    connection.release();
  }
};

// ===============================
// 🔹 VALIDAR TDR
// ===============================
exports.validarTdr = async (req, res) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    const { id } = req.params;
    const { accion, observaciones, usuarioAdminId } = req.body;

    let estado = "Pendiente";
    if (accion === "Validacion") estado = "Aprobado";
    if (accion === "Observacion") estado = "Observado";

    await connection.query(
      "UPDATE t_tdrs SET estado_verificacion = ? WHERE id = ?",
      [estado, id]
    );

    await connection.query(`
      INSERT INTO t_tdr_historial_validaciones
      (tdr_id, usuario_admin_id, accion, estado_resultante, comentario)
      VALUES (?,?,?,?,?)
    `, [id, usuarioAdminId, accion, estado, observaciones || null]);

    await connection.commit();
    res.json({ message: "TDR validado correctamente" });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Error validando TDR" });
  } finally {
    connection.release();
  }
};

// ===============================
// 🔹 ELIMINAR TDR (solo CONTRATANTE, solo estado Pendiente)
// ===============================
exports.deleteTdr = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT usuario_creador_id, estado_verificacion FROM t_tdrs WHERE id = ?',
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'TDR no encontrado' });

    const tdr = rows[0];

    if (tdr.usuario_creador_id !== req.user.id)
      return res.status(403).json({ message: 'No tiene permisos para eliminar este TDR' });

    if (tdr.estado_verificacion !== 'Pendiente')
      return res.status(400).json({ message: 'Solo se pueden eliminar TdR en estado Pendiente' });

    await pool.query('DELETE FROM t_tdr_historial_validaciones WHERE tdr_id = ?', [id]);
    await pool.query('DELETE FROM t_tdrs WHERE id = ?', [id]);

    res.json({ message: 'TdR eliminado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar TdR' });
  }
};

};