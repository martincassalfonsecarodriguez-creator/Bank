const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { engine, exec, get, run } = require("./connection");

async function initializeDatabase() {
  const schemaFile = engine === "postgres" ? "schema.pg.sql" : "schema.sql";
  const schema = fs.readFileSync(path.join(__dirname, schemaFile), "utf8");
  await exec(schema);

  const admin = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!admin) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await run(
      "INSERT INTO users (name, ci, password_hash, role, balance) VALUES (?, ?, ?, 'admin', 0)",
      ["Banco", "ADMIN", passwordHash]
    );
  }
}

module.exports = { initializeDatabase };
