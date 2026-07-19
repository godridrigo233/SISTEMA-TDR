require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const app = express();

const pool = require("./config/db");
const { JWT_SECRET } = require("./middleware/auth");

const tdrRoutes = require("./routes/tdrs.routes");
const locadoresRoutes = require("./routes/locadores.routes");
const plantillaRoutes = require('./routes/plantilla.routes');
const contratantesRoutes = require('./routes/contratantes.routes');
const maestrosRoutes = require('./routes/maestros.routes');

// =========================
// 1. 🔥 MIDDLEWARES GLOBALES (Siempre primero)
// =========================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Permite leer req.body en formato JSON
// Los documentos (DNI, CV, RUC, RNP) viven en Supabase Storage (bucket privado)
// y se acceden vía URLs firmadas — el filesystem local del contenedor es efímero.

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos, intente en 15 minutos" }
});

// =========================
// 🔐 LOGIN
// =========================
app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM t_usuarios WHERE username = ?",
      [username]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });

    // Si es CONTRATANTE, cargar su nombre del perfil para el saludo
    let nombre = user.nombres || user.username;
    if (user.rol === 'CONTRATANTE') {
      const [perfil] = await pool.query(
        "SELECT nombres, primer_apellido FROM t_contratantes_perfil WHERE usuario_id = ?",
        [user.id]
      );
      if (perfil.length > 0) nombre = perfil[0].nombres;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, rol: user.rol, nombre }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// =========================
// 2. 🔥 RUTAS (Siempre después de los middlewares)
// =========================
app.use('/api/plantilla', plantillaRoutes);
app.use("/api/tdrs", tdrRoutes);
app.use("/api/locadores", locadoresRoutes);
app.use('/api/contratantes', contratantesRoutes);
app.use('/api/maestros', maestrosRoutes);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
