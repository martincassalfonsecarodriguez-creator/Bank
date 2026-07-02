const { all, get, run } = require("../database/connection");

function createLoan({ userId, amount }) {
  return run("INSERT INTO loans (user_id, amount) VALUES (?, ?)", [userId, amount]);
}

function findById(id) {
  return get(
    `SELECT l.*, u.name AS user_name, u.ci AS user_ci
     FROM loans l
     JOIN users u ON u.id = l.user_id
     WHERE l.id = ?`,
    [id]
  );
}

function listForUser(userId) {
  return all("SELECT * FROM loans WHERE user_id = ? ORDER BY requested_at DESC, id DESC", [userId]);
}

function listAll() {
  return all(
    `SELECT l.*, u.name AS user_name, u.ci AS user_ci
     FROM loans l
     JOIN users u ON u.id = l.user_id
     ORDER BY l.requested_at DESC, l.id DESC`
  );
}

function updateAdminDecision(id, { status, interestRate }) {
  return run(
    "UPDATE loans SET status = ?, interest_rate = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, interestRate, id]
  );
}

function updateUserDecision(id, status) {
  return run("UPDATE loans SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
}

module.exports = { createLoan, findById, listForUser, listAll, updateAdminDecision, updateUserDecision };
