require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// Traduce códigos de error de Postgres a los equivalentes de MySQL que
// usa el resto del backend (err.code === 'ER_DUP_ENTRY', etc.)
const PG_ERROR_CODE_MAP = {
  "23505": "ER_DUP_ENTRY",            // unique_violation
  "23503": "ER_NO_REFERENCED_ROW_2",  // foreign_key_violation
  "23502": "ER_BAD_NULL_ERROR",       // not_null_violation
};

function translateError(err) {
  const mapped = PG_ERROR_CODE_MAP[err.code];
  if (mapped) {
    err.pgCode = err.code;
    err.code = mapped;
  }
  return err;
}

// Convierte placeholders estilo mysql2 (`?`) a estilo pg (`$1, $2, ...`)
function toPgPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

const INSERT_RE = /^\s*INSERT\s+INTO/i;
const WRITE_RE = /^\s*(UPDATE|DELETE)\b/i;

// Ejecuta una query emulando el formato de retorno `[rows]` / `[result]` de mysql2.
async function runQuery(executor, sql, params = []) {
  let pgSql = toPgPlaceholders(sql);
  const isInsert = INSERT_RE.test(pgSql) && !/RETURNING/i.test(pgSql);
  if (isInsert) pgSql += " RETURNING id";

  try {
    const result = await executor(pgSql, params);

    if (isInsert) {
      return [{ insertId: result.rows[0]?.id, affectedRows: result.rowCount }];
    }
    if (WRITE_RE.test(pgSql)) {
      return [{ affectedRows: result.rowCount }];
    }
    return [result.rows];
  } catch (err) {
    throw translateError(err);
  }
}

module.exports = {
  query: (sql, params) => runQuery((s, p) => pool.query(s, p), sql, params),

  async getConnection() {
    const client = await pool.connect();
    return {
      query: (sql, params) => runQuery((s, p) => client.query(s, p), sql, params),
      beginTransaction: () => client.query("BEGIN"),
      commit: () => client.query("COMMIT"),
      rollback: () => client.query("ROLLBACK"),
      release: () => client.release(),
    };
  },
};
