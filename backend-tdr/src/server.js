const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const tdrRoutes = require("./routes/tdrs.routes");
const locadoresRoutes = require("./routes/locadores.routes"); 
const JWT_SECRET = "claveprueba";
app.use(cors());
app.use(express.json());
app.use("/api/tdrs", tdrRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/locadores", locadoresRoutes);
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
app.post("/api/login", async (req, res) => {

  const { username, password } = req.body;

  try {

    const [rows] = await pool.query(
      "SELECT * FROM t_usuarios WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // 🔐 CREAR TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token, // 🔐 enviamos el token
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error en el servidor"
    });

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