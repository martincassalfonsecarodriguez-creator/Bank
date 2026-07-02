const { all, run } = require("../database/connection");

function createTransaction({ type, amount, description, fromUserId = null, toUserId = null, createdBy = null }) {
  return run(
    `INSERT INTO transactions (type, amount, description, from_user_id, to_user_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [type, amount, description, fromUserId, toUserId, createdBy]
  );
}

function listForUser(userId) {
  return all(
    `SELECT t.*, fu.name AS from_user_name, tu.name AS to_user_name, cu.name AS created_by_name
     FROM transactions t
     LEFT JOIN users fu ON fu.id = t.from_user_id
     LEFT JOIN users tu ON tu.id = t.to_user_id
     LEFT JOIN users cu ON cu.id = t.created_by
     WHERE t.from_user_id = ? OR t.to_user_id = ? OR t.created_by = ?
     ORDER BY t.created_at DESC, t.id DESC`,
    [userId, userId, userId]
  );
}

function listAll() {
  return all(
    `SELECT t.*, fu.name AS from_user_name, tu.name AS to_user_name, cu.name AS created_by_name
     FROM transactions t
     LEFT JOIN users fu ON fu.id = t.from_user_id
     LEFT JOIN users tu ON tu.id = t.to_user_id
     LEFT JOIN users cu ON cu.id = t.created_by
     ORDER BY t.created_at DESC, t.id DESC`
  );
}

module.exports = { createTransaction, listForUser, listAll };
