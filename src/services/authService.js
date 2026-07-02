const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const { get, run } = require("../database/connection");
const { AppError } = require("../utils/errors");
const { normalizeText, publicUser } = require("../utils/formatters");

function cleanAndValidateCI(input) {
  let cleanCI = String(input).replace(/\D/g, "");
  if (!cleanCI) return null;
  if (cleanCI.length === 7) cleanCI = "0" + cleanCI;
  if (cleanCI.length !== 8) return null;

  const weights = [2, 9, 8, 7, 6, 3, 4];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(cleanCI[i]) * weights[i];
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  if (checkDigit !== parseInt(cleanCI[7])) return null;

  return cleanCI;
}

function generateAccountNumber(ci) {
  const base = (Number(ci) * 7919 + 314159) % 1000000000;
  const baseStr = base.toString().padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(baseStr[i]) * (i + 1);
  }
  const checkDigit = sum % 10;
  return `${baseStr}-${checkDigit}`;
}

async function register({ name, ci, password }) {
  name = normalizeText(name);
  
  if (name.length < 2) throw new AppError("El nombre debe tener al menos 2 caracteres.");
  if (!password || password.length < 6) throw new AppError("La contrasena debe tener al menos 6 caracteres.");

  const validCI = cleanAndValidateCI(ci);
  if (!validCI) throw new AppError("La cédula ingresada no es válida. Verifique el formato y el dígito verificador.");

  const existing = await userModel.findByCi(validCI);
  if (existing) throw new AppError("Ya existe un usuario con esa CI.", 409);

  const accountNumber = generateAccountNumber(validCI);
  const passwordHash = await bcrypt.hash(password, 12);
  
  const latestTerms = await getLatestTerms();
  const version = latestTerms ? latestTerms.version : 1;

  const result = await userModel.createUser({ name, ci: validCI, accountNumber, passwordHash });
  await userModel.acceptTerms(result.id, version);
  
  const user = await userModel.findById(result.id);
  return publicUser(user);
}

async function login({ ci, password }) {
  const validCI = cleanAndValidateCI(ci);
  if (!validCI) throw new AppError("CI o contrasena incorrecta.", 401);

  const user = await userModel.findByCi(validCI);
  if (!user) throw new AppError("CI o contrasena incorrecta.", 401);

  const valid = await bcrypt.compare(password || "", user.password_hash);
  if (!valid) throw new AppError("CI o contrasena incorrecta.", 401);
  return publicUser(user);
}

async function getLatestTerms() {
  return get("SELECT * FROM terms_versions ORDER BY version DESC LIMIT 1");
}

async function acceptTerms(userId, version) {
  const terms = await getLatestTerms();
  if (!terms || version < terms.version) throw new AppError("Version de terminos invalida.");
  await userModel.acceptTerms(userId, version);
}

async function resetPassword({ ci, newPassword, masterCode }) {
  if (masterCode !== "-34.8847°,_,-56.15089°") {
    throw new AppError("Master Code invalido.");
  }
  const ciClean = cleanAndValidateCI(ci);
  const user = await userModel.findByCi(ciClean);
  if (!user) throw new AppError("Usuario no encontrado.");
  
  if (newPassword.length < 6) throw new AppError("La nueva contraseña debe tener al menos 6 caracteres.");
  
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userModel.updatePassword(user.id, passwordHash);
  
  return publicUser(user);
}

module.exports = { register, login, cleanAndValidateCI, generateAccountNumber, getLatestTerms, acceptTerms, resetPassword };
