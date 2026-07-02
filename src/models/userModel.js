const { all, get, run } = require("../database/connection");

function findByCi(ci) {
  return get("SELECT * FROM users WHERE ci = ?", [ci]);
}

function findById(id) {
  return get("SELECT * FROM users WHERE id = ?", [id]);
}

function listUsers() {
  return all("SELECT id, name, ci, role, balance, created_at, updated_at FROM users ORDER BY name");
}

function createUser({ name, ci, passwordHash, role = "user" }) {
  return run(
    "INSERT INTO users (name, ci, password_hash, role, balance) VALUES (?, ?, ?, ?, 0)",
    [name, ci, passwordHash, role]
  );
}

function updateUser(id, { name, ci, role }) {
  return run(
    "UPDATE users SET name = ?, ci = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, ci, role, id]
  );
}

function updateBalance(id, balance) {
  return run("UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [balance, id]);
}

function deleteUser(id) {
  return run("DELETE FROM users WHERE id = ?", [id]);
}

module.exports = { findByCi, findById, listUsers, createUser, updateUser, updateBalance, deleteUser };
