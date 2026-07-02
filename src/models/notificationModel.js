const { all, run } = require("../database/connection");

function createNotification({ userId = null, title, message, type = "info" }) {
  return run(
    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
    [userId, title, message, type]
  );
}

function listForUser(userId) {
  return all(
    `SELECT * FROM notifications
     WHERE user_id = ? OR user_id IS NULL
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );
}

function markReadForUser(userId) {
  return run("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL", [userId]);
}

module.exports = { createNotification, listForUser, markReadForUser };
