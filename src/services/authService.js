const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const { AppError } = require("../utils/errors");
const { normalizeText, publicUser } = require("../utils/formatters");

async function register({ name, ci, password }) {
  name = normalizeText(name);
  ci = normalizeText(ci).toUpperCase();

  if (name.length < 2) throw new AppError("El nombre debe tener al menos 2 caracteres.");
  if (ci.length < 3) throw new AppError("La CI debe tener al menos 3 caracteres.");
  if (!password || password.length < 6) throw new AppError("La contrasena debe tener al menos 6 caracteres.");

  const existing = await userModel.findByCi(ci);
  if (existing) throw new AppError("Ya existe un usuario con esa CI.", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await userModel.createUser({ name, ci, passwordHash });
  const user = await userModel.findById(result.id);
  return publicUser(user);
}

async function login({ ci, password }) {
  ci = normalizeText(ci).toUpperCase();
  const user = await userModel.findByCi(ci);
  if (!user) throw new AppError("CI o contrasena incorrecta.", 401);

  const valid = await bcrypt.compare(password || "", user.password_hash);
  if (!valid) throw new AppError("CI o contrasena incorrecta.", 401);
  return publicUser(user);
}

module.exports = { register, login };
