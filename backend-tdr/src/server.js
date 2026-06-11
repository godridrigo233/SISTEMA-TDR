const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

const tdrRoutes = require("./routes/tdrs.routes");
const locadoresRoutes = require("./routes/locadores.routes"); 
const plantillaRoutes = require('./routes/plantilla.routes'); // 👈 Importación
const contratantesRoutes = require('./routes/contratantes.routes');
const JWT_SECRET = "claveprueba";

// =========================
// 1. 🔥 MIDDLEWARES GLOBALES (Siempre primero)
// =========================
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Permite leer req.body en formato JSON
app.use("/uploads", express.static("uploads"));

// =========================
// 2. 🔥 RUTAS (Siempre después de los middlewares)
// =========================
app.use('/api/plantilla', plantillaRoutes); // 👈 Ahora está en el lugar correcto
app.use("/api/tdrs", tdrRoutes);
app.use("/api/locadores", locadoresRoutes);
app.use('/api/contratantes', contratantesRoutes);

// 🔹 Conexión a MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sistema_tdr"
});

// =========================
// 🔐 LOGIN
// =========================
// =========================
// 🔐 LOGIN
// =========================
// ═══════════════════════════════════════════════════════════════════
// REEMPLAZA el bloque app.post("/api/login", ...) en server.js
// ═══════════════════════════════════════════════════════════════════

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // ── 1. Buscar primero en t_contratantes_perfil ────────────────
    const [contratanteRows] = await pool.query(
      `SELECT cp.*, u.rol
       FROM t_contratantes_perfil cp
       JOIN t_usuarios u ON u.id = cp.usuario_id
       WHERE cp.username = ?`,
      [username]
    );

    if (contratanteRows.length > 0) {
      const contratante = contratanteRows[0];
      const passwordMatch = await bcrypt.compare(password, contratante.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      const token = jwt.sign(
        { id: contratante.usuario_id, username: contratante.username, rol: contratante.rol },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        success: true,
        token,
        user: {
          id:       contratante.usuario_id,
          username: contratante.username,
          rol:      contratante.rol,
          // Datos personales para mostrar en la app
          nombre:   `${contratante.nombres} ${contratante.primer_apellido}`,
          nombres:  contratante.nombres,
          apellidos: `${contratante.primer_apellido} ${contratante.segundo_apellido}`,
        }
      });
    }

    // ── 2. Si no es contratante, buscar en t_usuarios (ADMINISTRATIVO) ──
    const [adminRows] = await pool.query(
      "SELECT * FROM t_usuarios WHERE username = ?",
      [username]
    );

    if (adminRows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const admin = adminRows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, rol: admin.rol },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id:       admin.id,
        username: admin.username,
        rol:      admin.rol,
        nombre:   admin.username, // el admin no tiene perfil de nombre
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



// =========================
// ➕ CREAR LOCADOR
// =========================
app.post("/api/locadores", async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      tipoDocumento,
      numeroDocumento,
      ruc,
      telefono,
      correo,
      banco,
      cci
    } = req.body;

    await pool.query(
      `INSERT INTO m_locadores 
      (nombres, apellidos, tipo_documento, numero_documento, ruc, telefono, correo, banco, cci)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombres, apellidos, tipoDocumento, numeroDocumento, ruc, telefono, correo, banco, cci]
    );

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando locador" });
  }
});


// =========================
// ✏️ EDITAR LOCADOR
// =========================
app.put("/api/locadores/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const {
      nombres,
      apellidos,
      tipoDocumento,
      numeroDocumento,
      ruc,
      telefono,
      correo,
      banco,
      cci
    } = req.body;

    await pool.query(
      `UPDATE m_locadores SET
      nombres = ?, 
      apellidos = ?, 
      tipo_documento = ?, 
      numero_documento = ?, 
      ruc = ?, 
      telefono = ?, 
      correo = ?, 
      banco = ?, 
      cci = ?
      WHERE id = ?`,
      [nombres, apellidos, tipoDocumento, numeroDocumento, ruc, telefono, correo, banco, cci, id]
    );

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando locador" });
  }
});

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).send();
});
app.listen(4000, () => {
  console.log("Servidor corriendo en puerto 4000");
});