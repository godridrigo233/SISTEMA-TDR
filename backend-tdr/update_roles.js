const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function updateRoles() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "sistema_tdr"
  });
  
  try {
    // 1. Cambiar admin a rol ADMINISTRADOR
    await pool.query(
      "UPDATE t_usuarios SET rol = 'ADMINISTRADOR' WHERE username = 'admin'"
    );
    console.log("✓ Usuario 'admin' cambió a rol ADMINISTRADOR");

    // 2. Crear nuevo usuario administrativo
    const passwordHash = await bcrypt.hash("123456", 10);
    await pool.query(
      `INSERT INTO t_usuarios (username, password_hash, rol, nombres) 
       VALUES ('administrativo', ?, 'ADMINISTRATIVO', 'Administrativo')`,
      [passwordHash]
    );
    console.log("✓ Nuevo usuario 'administrativo' creado con rol ADMINISTRATIVO");

    // Verificar cambios
    const [users] = await pool.query("SELECT id, username, rol FROM t_usuarios ORDER BY username");
    console.log("\nUsuarios después de los cambios:");
    users.forEach(u => console.log(`  ${u.username} - ${u.rol}`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

updateRoles();
