function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    ci: user.ci,
    role: user.role,
    balance: user.balance,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

function normalizeText(value) {
  return String(value || "").trim();
}

function parsePositiveAmount(value, field = "monto") {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`El ${field} debe ser un numero entero mayor a cero.`);
  }
  return amount;
}

module.exports = { publicUser, normalizeText, parsePositiveAmount };
