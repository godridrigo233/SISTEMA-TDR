const mysql = require("mysql2/promise");

async function checkSchema() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "sistema_tdr"
  });
  
  try {
    const [cols] = await pool.query("DESCRIBE t_usuarios");
    console.log("Estructura de t_usuarios:");
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
