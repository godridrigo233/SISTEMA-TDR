const mysql = require("mysql2/promise");

async function checkRoles() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "sistema_tdr"
  });
  
  try {
    const [rows] = await pool.query("SELECT DISTINCT rol FROM t_usuarios");
    console.log("Roles actuales:", rows);
    
    const [users] = await pool.query("SELECT id, username, rol FROM t_usuarios");
    console.log("\nUsuarios actuales:");
    users.forEach(u => console.log(`  ${u.username} - ${u.rol}`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

checkRoles();
