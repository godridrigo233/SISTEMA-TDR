const pool = require('../config/db');


// ===============================
// 🔹 LISTAR TDRs
// ===============================
exports.getTdrs = async (req, res) => {

  try {

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
      ORDER BY t.id DESC
    `);

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
      message: "Error obteniendo TDRs"
    });

  }

};

// ===============================
// 🔹 OBTENER TDR POR ID
// ===============================
// ═══════════════════════════════════════════════════════════════════
// REEMPLAZA solo exports.getTdrById en tdrs.controller.js
// El resto del archivo (getTdrs, createTdr, updateTdr, validarTdr)
// queda exactamente igual.
// ═══════════════════════════════════════════════════════════════════


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

        -- Datos del CONTRATANTE (quien creó el TDR) para la sección Colaborador
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

    // ── Locador: persona externa (m_locadores) — firma todos los docs ────
    const [locadorRows] = await pool.query(
      'SELECT * FROM m_locadores WHERE id = ?',
      [tdr.locador_id]
    );

    // ── Contratante: subobjeto con los datos del colaborador ─────────────
    // apellidos = primer_apellido + segundo_apellido (para nombre completo)
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

    // Limpiar columnas cnt_* del objeto raíz
    Object.keys(tdr)
      .filter(k => k.startsWith('cnt_') || k === 'creado_por_username')
      .forEach(k => delete tdr[k]);

    // ── Subtablas ─────────────────────────────────────────────────────────
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
    ).catch(() => [[]]);  // tabla opcional

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
      'SELECT * FROM t_tdr_historial_validaciones WHERE tdr_id = ?', [id]
    );

    const documentos = {};
    documentosRows.forEach(doc => {
      if (doc.tipo_documento === 'CV_DOCUMENTADO') documentos.cv  = doc.ruta_archivo;
      if (doc.tipo_documento === 'DNI_CE')         documentos.dni = doc.ruta_archivo;
      if (doc.tipo_documento === 'RNP')            documentos.rnp = doc.ruta_archivo;
      if (doc.tipo_documento === 'RUC')            documentos.ruc = doc.ruta_archivo;
    });

    res.json({
      ...tdr,
      locador:      locadorRows[0] || null,
      contratante,                              // null si no tiene perfil completo
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

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    const {
      codigo,
      locadorId,
      equipoId,
      denominacionConvocatoria,
      descripcionServicio,
      plazoEjecucionDias,
      totalHonorarios,
      numeroArmadas,
      usuarioCreadorId,
      esNuevoLocador
    } = req.body;

    const periodo = JSON.parse(req.body.periodo || "{}");
    const actividades = JSON.parse(req.body.actividades || "[]");
    const entregables = JSON.parse(req.body.entregables || "[]");
    const locadorData = JSON.parse(req.body.locadorData || "{}");
    const formacion = JSON.parse(req.body.formacion || "[]");
    const experiencias = JSON.parse(req.body.experiencias || "[]");



    // ===============================
    // 🔹 CREAR LOCADOR SI NO EXISTE
    // ===============================

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
          (apellidos,nombres,tipo_documento,numero_documento,
          ruc,domicilio,telefono_celular,correo_electronico,
          fecha_nacimiento,cci,genero,estado_civil,nacionalidad,
          lugar_nacimiento,banco)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,[
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



    // ===============================
    // 🔹 FORMACIÓN
    // ===============================

    for(const f of formacion){

      await connection.query(`
        INSERT INTO t_locador_formacion
        (locador_id,centro_estudios,especialidad,grado_obtenido,ciudad,fecha_inicio,fecha_fin)
        VALUES (?,?,?,?,?,?,?)
      `,[
        locadorFinalId,
        f.centroEstudios || "",
        f.especialidad || "",
        f.gradoObtenido || "",
        f.ciudad || "",
        f.fechaInicio || null,
        f.fechaFin || null
      ]);

    }



    // ===============================
    // 🔹 EXPERIENCIA
    // ===============================

    for(const exp of experiencias){

      await connection.query(`
      INSERT INTO t_locador_experiencia
      (locador_id, tipo_experiencia, entidad_empresa, cargo, descripcion_trabajo, fecha_inicio, fecha_fin)
      VALUES (?,?,?,?,?,?,?)
    `, [
      locadorFinalId,
      exp.tipoExperiencia || "General",
      exp.nombreEntidad || "",
      exp.cargo || "",              
      exp.descripcionTrabajo || "",
      exp.fechaInicio || null,
      exp.fechaFin || null
    ]);

    }



    // ===============================
    // 🔹 PERIODO
    // ===============================

    const [periodoRows] = await connection.query(
      "SELECT id FROM m_periodos WHERE anio=? AND nombre_mes=?",
      [periodo.año,periodo.mes]
    );

    if(periodoRows.length === 0){

      throw new Error("Periodo no encontrado");

    }

    const periodo_id = periodoRows[0].id;



    // ===============================
    // 🔹 INSERTAR TDR
    // ===============================

    const [result] = await connection.query(`
      INSERT INTO t_tdrs
      (codigo_unico,locador_id,equipo_id,periodo_id,
      usuario_creador_id,denominacion,objetivo,
      plazo_ejecucion,honorario_total,total_armadas)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `,[
      codigo,
      locadorFinalId,
      equipoId,
      periodo_id,
      usuarioCreadorId,
      denominacionConvocatoria,
      descripcionServicio,
      plazoEjecucionDias,
      totalHonorarios,
      numeroArmadas
    ]);

    const tdrId = result.insertId;



    // ===============================
    // 🔹 ACTIVIDADES
    // ===============================

    for(const act of actividades){

      await connection.query(
        "INSERT INTO t_tdr_actividades (tdr_id,descripcion) VALUES (?,?)",
        [tdrId,act.descripcion]
      );

    }



    // ===============================
    // 🔹 ENTREGABLES
    // ===============================

    for(const ent of entregables){

      await connection.query(`
        INSERT INTO t_tdr_entregables
        (tdr_id,nro_armada,descripcion,fecha_inicio,fecha_fin,monto_pago)
        VALUES (?,?,?,?,?,?)
      `,[
        tdrId,
        ent.armada,
        ent.descripcion,
        ent.fechaInicioArmada,
        ent.fechaFinArmada,
        ent.monto
      ]);

    }



    // ===============================
    // 🔹 DOCUMENTOS
    // ===============================

    if(req.files){

      const documentos = [
        {key:"dniFile",tipo:"DNI_CE"},
        {key:"rnpFile",tipo:"RNP"},
        {key:"rucFile",tipo:"RUC"},
        {key:"cvFile",tipo:"CV_DOCUMENTADO"}
      ];

      for(const doc of documentos){

        if(req.files[doc.key]){

          const file = req.files[doc.key][0];

          await connection.query(`
            INSERT INTO t_locador_documentos
            (locador_id,tdr_id,tipo_documento,ruta_archivo)
            VALUES (?,?,?,?)
          `,[
            locadorFinalId,
            tdrId,
            doc.tipo,
            `uploads/${file.filename}`
          ]);

        }

      }

    }



    await connection.commit();

    res.json({
      message:"TDR creado correctamente",
      id:tdrId
    });

  } catch(error){

    await connection.rollback();

    console.error("Error creando TDR:",error);

    res.status(500).json({
      message:error.message || "Error interno"
    });

  } finally {

    connection.release();

  }

};

// ===============================
// 🔹 ACTUALIZAR TDR
// ===============================
exports.updateTdr = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // 1. Extraemos los campos simples
    const {
      codigo,
      equipoId,
      denominacionConvocatoria,
      descripcionServicio,
      plazoEjecucionDias,
      totalHonorarios,
      numeroArmadas,
      usuarioCreadorId
    } = req.body;

    // 🔥 2. AQUÍ SE DEFINEN LAS VARIABLES FALTANTES (¡Muy importante!)
    const periodo = JSON.parse(req.body.periodo || "{}");
    const actividades = JSON.parse(req.body.actividades || "[]");
    const entregables = JSON.parse(req.body.entregables || "[]");
    const formacion = JSON.parse(req.body.formacion || "[]");
    const experiencias = JSON.parse(req.body.experiencias || "[]");

    // 3. Obtener periodo_id correcto
    const [periodoRows] = await connection.query(
      "SELECT id FROM m_periodos WHERE anio=? AND nombre_mes=?",
      [periodo.año, periodo.mes]
    );
    if(periodoRows.length === 0){
      throw new Error("Periodo no encontrado en la base de datos.");
    }
    const periodo_id = periodoRows[0].id;

    // 4. ACTUALIZAR TDR (Y pasarlo a Pendiente)
    await connection.query(`
      UPDATE t_tdrs
      SET 
        codigo_unico = ?,
        equipo_id = ?,
        periodo_id = ?,
        denominacion = ?,
        objetivo = ?,
        plazo_ejecucion = ?,
        honorario_total = ?,
        total_armadas = ?,
        estado_verificacion = 'Pendiente'
      WHERE id = ?
    `, [
      codigo, equipoId, periodo_id, denominacionConvocatoria, 
      descripcionServicio, plazoEjecucionDias, totalHonorarios, numeroArmadas, id
    ]);

    // 5. REGISTRAR HISTORIAL DE EDICIÓN
    if (usuarioCreadorId) {
      await connection.query(`
        INSERT INTO t_tdr_historial_validaciones
        (tdr_id, usuario_admin_id, accion, estado_resultante, comentario)
        VALUES (?, ?, 'Edicion', 'Pendiente', 'El contratante ha editado y actualizado el TdR para una nueva revisión.')
      `, [id, usuarioCreadorId]);
    }

    // Extraer el locador asociado a este TdR
    const [tdrInfo] = await connection.query("SELECT locador_id FROM t_tdrs WHERE id=?", [id]);
    const locadorId = tdrInfo[0].locador_id;

    // 6. ACTUALIZAR FORMACIÓN
    await connection.query("DELETE FROM t_locador_formacion WHERE locador_id = ?", [locadorId]);
    for (const f of formacion) {
      await connection.query(`
        INSERT INTO t_locador_formacion
        (locador_id, centro_estudios, especialidad, grado_obtenido, ciudad, fecha_inicio, fecha_fin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        locadorId, 
        f.centroEstudios || "", 
        f.especialidad || "", 
        f.gradoObtenido || "",
        f.ciudad || "",
        f.fechaInicio || null,
        f.fechaFin || null
      ]);
    }

    // 7. ACTUALIZAR EXPERIENCIA
    await connection.query("DELETE FROM t_locador_experiencia WHERE locador_id = ?", [locadorId]);
    for (const exp of experiencias) {
      await connection.query(`
        INSERT INTO t_locador_experiencia
        (locador_id, tipo_experiencia, entidad_empresa, cargo, descripcion_trabajo, fecha_inicio, fecha_fin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        locadorId,
        exp.tipoExperiencia || "General",
        exp.nombreEntidad || "",
        exp.cargo || "",              // ← NUEVO
        exp.descripcionTrabajo || "",
        exp.fechaInicio || null,
        exp.fechaFin || null
      ]);
    }

    // 8. ACTUALIZAR ACTIVIDADES
    await connection.query("DELETE FROM t_tdr_actividades WHERE tdr_id = ?", [id]);
    for(const act of actividades){
      await connection.query(
        "INSERT INTO t_tdr_actividades (tdr_id, descripcion) VALUES (?, ?)",
        [id, act.descripcion]
      );
    }

    // 9. ACTUALIZAR ENTREGABLES
    await connection.query("DELETE FROM t_tdr_entregables WHERE tdr_id = ?", [id]);
    for(const ent of entregables){
      await connection.query(`
        INSERT INTO t_tdr_entregables
        (tdr_id, nro_armada, descripcion, fecha_inicio, fecha_fin, monto_pago)
        VALUES (?, ?, ?, ?, ?, ?)
      `,[
        id, ent.armada, ent.descripcion, ent.fechaInicioArmada, ent.fechaFinArmada, ent.monto
      ]);
    }

    // 10. ACTUALIZAR DOCUMENTOS
    if (req.files) {
      const documentosTipos = [
        { key: "dniFile", tipo: "DNI_CE" },
        { key: "rnpFile", tipo: "RNP" },
        { key: "rucFile", tipo: "RUC" },
        { key: "cvFile", tipo: "CV_DOCUMENTADO" }
      ];

      for (const doc of documentosTipos) {
        if (req.files[doc.key]) {
          const file = req.files[doc.key][0];
          const [existeDoc] = await connection.query(
            "SELECT id FROM t_locador_documentos WHERE tdr_id = ? AND tipo_documento = ?",
            [id, doc.tipo]
          );

          if (existeDoc.length > 0) {
            await connection.query(`
              UPDATE t_locador_documentos 
              SET ruta_archivo = ? 
              WHERE id = ?
            `, [`uploads/${file.filename}`, existeDoc[0].id]);
          } else {
            await connection.query(`
              INSERT INTO t_locador_documentos
              (locador_id, tdr_id, tipo_documento, ruta_archivo)
              VALUES (?, ?, ?, ?)
            `, [locadorId, id, doc.tipo, `uploads/${file.filename}`]);
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
exports.validarTdr = async (req,res)=>{

  const connection = await pool.getConnection();

  try{

    await connection.beginTransaction();

    const {id} = req.params;
    const {accion,observaciones,usuarioAdminId} = req.body;

    let estado="Pendiente";

    if(accion==="Validacion") estado="Aprobado";
    if(accion==="Observacion") estado="Observado";

    await connection.query(`
      UPDATE t_tdrs
      SET estado_verificacion=?
      WHERE id=?
    `,[estado,id]);

    await connection.query(`
      INSERT INTO t_tdr_historial_validaciones
      (tdr_id,usuario_admin_id,accion,estado_resultante,comentario)
      VALUES (?,?,?,?,?)
    `,[id,usuarioAdminId,accion,estado,observaciones || null]);

    await connection.commit();

    res.json({
      message:"TDR validado correctamente"
    });

  }catch(error){

    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message:"Error validando TDR"
    });

  }finally{

    connection.release();

  }

};