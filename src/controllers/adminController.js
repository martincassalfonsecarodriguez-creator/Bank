const path = require("path");
const config = require("../config/env");
const userModel = require("../models/userModel");
const transactionModel = require("../models/transactionModel");
const loanModel = require("../models/loanModel");
const notificationService = require("../services/notificationService");
const loanService = require("../services/loanService");
const bankService = require("../services/bankService");
const { AppError, asyncHandler } = require("../utils/errors");
const { publicUser, normalizeText } = require("../utils/formatters");

const overview = asyncHandler(async (req, res) => {
  const [users, transactions, loans] = await Promise.all([
    userModel.listUsers(),
    transactionModel.listAll(),
    loanModel.listAll()
  ]);
  res.json({ users, transactions, loans });
});

const userDetail = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.params.id);
  if (!user) throw new AppError("Usuario no encontrado.", 404);
  const [transactions, loans] = await Promise.all([
    transactionModel.listForUser(user.id),
    loanModel.listForUser(user.id)
  ]);
  res.json({ user: publicUser(user), transactions, loans });
});

const updateUser = asyncHandler(async (req, res) => {
  const name = normalizeText(req.body.name);
  const ci = normalizeText(req.body.ci).toUpperCase();
  const role = req.body.role === "admin" ? "admin" : "user";
  if (name.length < 2 || ci.length < 3) throw new AppError("Nombre o CI invalidos.");
  await userModel.updateUser(req.params.id, { name, ci, role });
  res.json({ ok: true });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.session.user.id) throw new AppError("No puedes eliminar tu propia cuenta.");
  await userModel.deleteUser(req.params.id);
  res.json({ ok: true });
});

const adjustBalance = asyncHandler(async (req, res) => {
  await bankService.adjustBalance({
    adminId: req.session.user.id,
    userId: req.params.id,
    amount: req.body.amount,
    operation: req.body.operation
  });
  res.json({ ok: true });
});

const decideLoan = asyncHandler(async (req, res) => {
  await loanService.adminDecision({
    loanId: req.params.id,
    approve: Boolean(req.body.approve),
    interestRate: req.body.interestRate
  });
  res.json({ ok: true });
});

const sendNotification = asyncHandler(async (req, res) => {
  await notificationService.notifyUser(req.params.id, "Mensaje del banco", normalizeText(req.body.message), "bank_message");
  res.json({ ok: true });
});

const sendAnnouncement = asyncHandler(async (req, res) => {
  await notificationService.broadcast("Anuncio del banco", normalizeText(req.body.message), "announcement");
  res.json({ ok: true });
});

const downloadBackup = asyncHandler(async (req, res) => {
  if (config.databaseUrl) {
    throw new AppError("El backup descargable solo esta disponible cuando se usa SQLite local.");
  }
  const fileName = `banco-familiar-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
  res.download(config.databaseFile, fileName, (error) => {
    if (error && !res.headersSent) {
      res.status(500).json({ error: "No se pudo generar el backup." });
    }
  });
});

module.exports = {
  overview,
  userDetail,
  updateUser,
  deleteUser,
  adjustBalance,
  decideLoan,
  sendNotification,
  sendAnnouncement,
  downloadBackup
};
