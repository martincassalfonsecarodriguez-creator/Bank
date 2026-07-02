const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { engine, exec, get, run } = require("./connection");

async function initializeDatabase() {
  const schemaFile = engine === "postgres" ? "schema.pg.sql" : "schema.sql";
  const schema = fs.readFileSync(path.join(__dirname, schemaFile), "utf8");
  await exec(schema);

  // Automatic migrations for existing databases
  const timestampType = engine === "postgres" ? "TIMESTAMP" : "TEXT";
  try { await run("ALTER TABLE users ADD COLUMN balance_corriente INTEGER NOT NULL DEFAULT 0 CHECK (balance_corriente >= 0)"); } catch (e) {}
  try { await run("ALTER TABLE users ADD COLUMN balance_ahorro INTEGER NOT NULL DEFAULT 0 CHECK (balance_ahorro >= 0)"); } catch (e) {}
  try { await run(`ALTER TABLE users ADD COLUMN last_ahorro_calc_date ${timestampType} NOT NULL DEFAULT CURRENT_TIMESTAMP`); } catch (e) {}
  try { await run("ALTER TABLE users ADD COLUMN credit_score INTEGER NOT NULL DEFAULT 500"); } catch (e) {}
  try { await run("ALTER TABLE users ADD COLUMN accepted_terms_version INTEGER DEFAULT 0"); } catch (e) {}
  try { await run(`ALTER TABLE users ADD COLUMN accepted_terms_date ${timestampType}`); } catch (e) {}
  
  // Migrate existing balance to balance_corriente if needed
  try { await run("UPDATE users SET balance_corriente = balance WHERE balance IS NOT NULL"); } catch (e) {}

  const admin = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!admin) {
    const { generateAccountNumber } = require("../services/authService");
    const passwordHash = await bcrypt.hash("-34.8847°,_,-56.15089°", 12);
    const adminCi = "59935501";
    const accountNumber = generateAccountNumber(adminCi);
    await run(
      "INSERT INTO users (name, ci, account_number, password_hash, role, balance_corriente, balance_ahorro, credit_score, accepted_terms_version, accepted_terms_date) VALUES (?, ?, ?, ?, 'admin', 0, 0, 800, 1, CURRENT_TIMESTAMP)",
      ["Administrador", adminCi, accountNumber, passwordHash]
    );
  }

  const terms = await get("SELECT version FROM terms_versions WHERE version = 1");
  if (!terms) {
    const termsText = `TÉRMINOS Y CONDICIONES DE USO
Banco Familiar (Versión 1.0)

1. Naturaleza del servicio
Banco Familiar es un simulador bancario educativo y recreativo.
Todo el dinero administrado dentro de la plataforma es completamente ficticio y no tiene valor económico real.

2. Relación con instituciones financieras
El dinero utilizado en esta plataforma no es emitido por el Banco de la República Oriental del Uruguay, no posee respaldo financiero y no constituye una moneda oficial.

3. Registro de usuarios
Cada usuario deberá registrarse utilizando una cédula de identidad uruguaya válida. No podrán existir dos cuentas asociadas a una misma cédula.

4. Seguridad de la cuenta
Cada usuario es responsable de mantener la confidencialidad de su contraseña.

5. Cuenta corriente y cuenta de ahorro
La plataforma dispone de una cuenta corriente para operaciones habituales y una cuenta de ahorro que puede generar un rendimiento periódico.

6. Préstamos
Los préstamos podrán aprobarse automáticamente, rechazarse automáticamente o requerir revisión manual.
El plazo máximo de devolución será de dos (2) días, salvo que el administrador establezca otro plazo.
El incumplimiento podrá afectar negativamente el puntaje crediticio.

7. Puntaje crediticio
La plataforma utiliza un sistema interno de puntaje crediticio con fines exclusivamente educativos.
El administrador podrá revisarlo, corregirlo o modificarlo manualmente cuando existan razones justificadas.

8. Facultades del administrador
El administrador podrá agregar o quitar dinero, aplicar impuestos, modificar tasas de interés, corregir errores y suspender cuentas cuando sea necesario.

9. Uso indebido
Si se confirma que un usuario obtuvo dinero mediante errores del sistema, herramientas externas o manipulación indebida, el administrador podrá retirar el dinero, revertir operaciones, modificar el puntaje crediticio o suspender la cuenta.

10. Anuncios
La plataforma podrá mostrar anuncios y comunicaciones relacionadas con el funcionamiento del Banco Familiar.

11. Limitación de responsabilidad
Banco Familiar es un proyecto educativo y recreativo.
La administración no será responsable por pérdidas de dinero ficticio, cambios de puntaje crediticio o decisiones financieras tomadas por los usuarios dentro del simulador.

12. Modificaciones
La administración podrá modificar estos términos y condiciones en cualquier momento.`;

    await run("INSERT INTO terms_versions (version, content) VALUES (1, ?)", [termsText]);
  }
}

module.exports = { initializeDatabase };
