const { all, get, run } = require("../database/connection");

async function applyAhorroInterest(user) {
  if (!user) return null;
  if (!user.last_ahorro_calc_date) return user;
  
  const lastDate = new Date(user.last_ahorro_calc_date);
  const now = new Date();
  const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  
  if (days >= 1) {
    let finalAhorro = user.balance_ahorro;
    if (user.balance_ahorro > 0) {
      const interestRate = 0.00001; // 0.001% diario
      const newAhorro = user.balance_ahorro * Math.pow((1 + interestRate), days);
      finalAhorro = Math.floor(newAhorro);
    }
    const newDate = now.toISOString();
    
    // We update the DB regardless if balance grew, to reset the timer (since it's been >= 1 day)
    await run("UPDATE users SET balance_ahorro = ?, last_ahorro_calc_date = ? WHERE id = ?", [finalAhorro, newDate, user.id]);
    
    user.balance_ahorro = finalAhorro;
    user.last_ahorro_calc_date = newDate;
  }
  return user;
}

async function findByCi(ci) {
  const user = await get("SELECT * FROM users WHERE ci = ?", [ci]);
  return applyAhorroInterest(user);
}

async function findById(id) {
  const user = await get("SELECT * FROM users WHERE id = ?", [id]);
  return applyAhorroInterest(user);
}

async function listUsers() {
  const users = await all("SELECT id, name, ci, account_number, role, balance_corriente, balance_ahorro, credit_score, created_at, updated_at, last_ahorro_calc_date FROM users ORDER BY name");
  return Promise.all(users.map(applyAhorroInterest));
}

function createUser({ name, ci, accountNumber, passwordHash, role = "user" }) {
  return run(
    "INSERT INTO users (name, ci, account_number, password_hash, role, balance_corriente, balance_ahorro, credit_score) VALUES (?, ?, ?, ?, ?, 1000, 0, 500)",
    [name, ci, accountNumber, passwordHash, role]
  );
}

function updateUser(id, { name, ci, role }) {
  return run(
    "UPDATE users SET name = ?, ci = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, ci, role, id]
  );
}

function updateBalanceCorriente(id, balance) {
  return run("UPDATE users SET balance_corriente = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [balance, id]);
}

function updateBalanceAhorro(id, balance) {
  return run("UPDATE users SET balance_ahorro = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [balance, id]);
}

function deleteUser(id) {
  return run("DELETE FROM users WHERE id = ?", [id]);
}

function acceptTerms(id, version) {
  return run("UPDATE users SET accepted_terms_version = ?, accepted_terms_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [version, id]);
}

async function updateCreditScore(id, newScore, reason, adminId) {
  const user = await findById(id);
  if (!user) return;
  await run("INSERT INTO credit_score_history (user_id, old_score, new_score, reason, changed_by) VALUES (?, ?, ?, ?, ?)", [id, user.credit_score, newScore, reason, adminId]);
  return run("UPDATE users SET credit_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newScore, id]);
}

function getCreditScoreHistory(userId) {
  return all("SELECT * FROM credit_score_history WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

function getRanking() {
  return all("SELECT id, name, account_number, balance_corriente, balance_ahorro, (balance_corriente + balance_ahorro) as patrimonio FROM users WHERE role = 'user' ORDER BY patrimonio DESC LIMIT 100");
}

function updatePassword(id, passwordHash) {
  return run("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [passwordHash, id]);
}

module.exports = { findByCi, findById, listUsers, createUser, updateUser, updateBalanceCorriente, updateBalanceAhorro, deleteUser, acceptTerms, updateCreditScore, getCreditScoreHistory, getRanking, updatePassword };
