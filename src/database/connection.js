const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const config = require("../config/env");

const engine = config.databaseUrl ? "postgres" : "sqlite";
let db = null;
let pool = null;

if (engine === "postgres") {
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
  });
} else {
  const sqlite3 = require("sqlite3").verbose();
  fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
  db = new sqlite3.Database(config.databaseFile);
  db.run("PRAGMA foreign_keys = ON");
}

function toPostgres(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function runPostgres(sql, params) {
  let query = toPostgres(sql);
  if (/^\s*insert\s+/i.test(query) && !/\sreturning\s+/i.test(query)) {
    query += " RETURNING id";
  }
  const result = await pool.query(query, params);
  return {
    id: result.rows[0] ? result.rows[0].id : undefined,
    changes: result.rowCount
  };
}

function runSqlite(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getSqlite(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row)));
  });
}

function allSqlite(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

function execSqlite(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => (error ? reject(error) : resolve()));
  });
}

function run(sql, params = []) {
  return engine === "postgres" ? runPostgres(sql, params) : runSqlite(sql, params);
}

async function get(sql, params = []) {
  if (engine === "postgres") {
    const result = await pool.query(toPostgres(sql), params);
    return result.rows[0];
  }
  return getSqlite(sql, params);
}

async function all(sql, params = []) {
  if (engine === "postgres") {
    const result = await pool.query(toPostgres(sql), params);
    return result.rows;
  }
  return allSqlite(sql, params);
}

function exec(sql) {
  return engine === "postgres" ? pool.query(sql).then(() => undefined) : execSqlite(sql);
}

module.exports = { db, pool, engine, run, get, all, exec };
