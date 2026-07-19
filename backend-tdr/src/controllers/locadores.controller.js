const db = require('../config/db');
const pool = require('../config/db');
const { getSignedUrl } = require('../config/storage');
exports.getLocadores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        l.id,
        l.nombres,
        l.apellidos,
        l.tipo_documento AS locador_tipo_documento,
        l.numero_documento,
        l.ruc,  
        l.correo_electronico,
        l.telefono_celular,
        l.banco,
        d.id as doc_id,
        d.tipo_documento AS documento_tipo,
        d.ruta_archivo
      FROM m_locadores l
      LEFT JOIN t_locador_documentos d
        ON l.id = d.locador_id
      ORDER BY l.id DESC
    `);
    const esAdmin = req.user?.rol === 'ADMINISTRADOR';
    // 🔥 Agrupar documentos por locador
    const locadoresMap = {};

    rows.forEach(row => {
      if (!locadoresMap[row.id]) {
        locadoresMap[row.id] = {
          id: row.id,
          nombres: row.nombres,
          apellidos: row.apellidos,
          tipo_documento: row.locador_tipo_documento,
          numero_documento: row.numero_documento,
          ruc: row.ruc,
          correo_electronico: row.correo_electronico,
          telefono_celular: row.telefono_celular,
          ...(esAdmin && { banco: row.banco }),
          documentos: []
        };
      }

      if (row.doc_id) {
        locadoresMap[row.id].documentos.push({
          id: row.doc_id,
          tipo_documento: row.documento_tipo,
          ruta_archivo: row.ruta_archivo // path interno — se firma abajo
        });
      }
    });

    // Firmar todas las rutas de documentos antes de responder
    for (const locador of Object.values(locadoresMap)) {
      for (const doc of locador.documentos) {
        doc.ruta_archivo = await getSignedUrl(doc.ruta_archivo);
      }
    }

    res.json(Object.values(locadoresMap));

  } catch (error) {
    console.error("Error obteniendo locadores:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
// ===============================
// OBTENER LOCADOR POR ID
// ===============================
exports.getLocadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM m_locadores WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Locador no encontrado' });
    }

    const locador = rows[0];
    if (req.user?.rol !== 'ADMINISTRADOR') {
      delete locador.banco;
      delete locador.cci;
    }

    res.json(locador);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener locador' });
  }
};
exports.getLocadorByDni = async (req, res) => {
  try {
    const { numero_documento} = req.params;

    // 1️⃣ Buscar locador
    const [locadorRows] = await pool.query(
      "SELECT * FROM m_locadores WHERE numero_documento = ?",
      [numero_documento]
    );

    if (locadorRows.length === 0) {
      return res.status(404).json({
        message: "Locador no encontrado"
      });
    }

    const locador = locadorRows[0];

    // 2️⃣ Traer experiencia
    const [experiencia] = await pool.query(
      "SELECT * FROM t_locador_experiencia WHERE locador_id = ?",
      [locador.id]
    );

    // 3️⃣ Traer documentos
    const [documentos] = await pool.query(
      "SELECT * FROM t_locador_documentos WHERE locador_id = ?",
      [locador.id]
    );
    for (const doc of documentos) {
      doc.ruta_archivo = await getSignedUrl(doc.ruta_archivo);
    }

    const esAdmin = req.user?.rol === 'ADMINISTRADOR';
    if (!esAdmin) {
      delete locador.banco;
      delete locador.cci;
    }

    res.json({
      ...locador,
      experiencias: experiencia,
      documentos
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo locador" });
  }
};
// ===============================
// CREAR LOCADOR
// ===============================
exports.createLocador = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      tipo_documento,
      numero_documento,
      ruc,
      domicilio,
      telefono_celular,
      correo_electronico,
      banco,
      cci
    } = req.body; 

    // 🔥 VALIDACIÓN DOCUMENTO
    if (tipo_documento === 'DNI' && !/^\d{8}$/.test(numero_documento)) {
      return res.status(400).json({
        message: 'El DNI debe tener exactamente 8 dígitos'
      });
    }

    if (tipo_documento === 'CE' && !/^\d{9}$/.test(numero_documento)) {
      return res.status(400).json({
        message: 'El Carnet de Extranjería debe tener exactamente 9 dígitos'
      });
    }

    // 🔥 VALIDACIÓN RUC (11 dígitos)
    if (!/^\d{11}$/.test(ruc)) {
      return res.status(400).json({
        message: 'El RUC debe tener exactamente 11 dígitos'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO m_locadores (
        nombres,
        apellidos,
        tipo_documento,
        numero_documento,
        ruc,
        domicilio,
        telefono_celular,
        correo_electronico,
        banco,
        cci
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombres,
        apellidos,
        tipo_documento,
        numero_documento,
        ruc,
        domicilio,
        telefono_celular,
        correo_electronico,
        banco,
        cci
      ]
    );

    res.json({
      id: result.insertId,
      message: 'Locador creado correctamente'
    });

  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'El número de documento o RUC ya existe'
      });
    }

    console.error(error);
    res.status(500).json({ message: 'Error creando locador' });
  }
};

// ===============================
// ACTUALIZAR LOCADOR
// ===============================
exports.updateLocador = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      apellidos,
      nombres,
      domicilio,
      telefono_celular,
      correo_electronico,
      banco,
      ruc,
      cci
    } = req.body;

    await db.query(
      `UPDATE m_locadores
       SET apellidos = ?,
           nombres = ?,
           domicilio = ?,
           telefono_celular = ?,
           correo_electronico = ?,
           banco = ?,
           ruc = ?,
           cci = ?
       WHERE id = ?`,
      [
        apellidos,
        nombres,
        domicilio,
        telefono_celular,
        correo_electronico,
        banco,
        ruc,
        cci,
        id
      ]
    );

    res.json({ message: 'Locador actualizado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar locador' });
  }
};

// ===============================
// ELIMINAR LOCADOR
// ===============================
exports.deleteLocador = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM m_locadores WHERE id = ?', [id]);

    res.json({ message: 'Locador eliminado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar locador' });
  }
};