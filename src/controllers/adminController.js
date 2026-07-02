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
  
  const stats = {
    totalCorriente: users.reduce((sum, u) => sum + (u.balance_corriente || 0), 0),
    totalAhorro: users.reduce((sum, u) => sum + (u.balance_ahorro || 0), 0),
    totalPrestamosAprobados: loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.amount || 0), 0),
  };
  
  res.json({ users, transactions, loans, stats });
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

const updateCreditScore = asyncHandler(async (req, res) => {
  const score = parseInt(req.body.score);
  if (isNaN(score) || score < 200 || score > 800) {
    throw new AppError("El puntaje debe estar entre 200 y 800.");
  }
  await userModel.updateCreditScore(req.params.id, score, normalizeText(req.body.reason), req.session.user.id);
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

const runTaxes = asyncHandler(async (req, res) => {
  const users = await userModel.listUsers();
  const taxRate = 0.02; // 2%
  
  for (const user of users) {
    if (user.role === 'admin') continue;
    const patrimonio = user.balance_corriente + user.balance_ahorro;
    if (patrimonio > 0) {
      const taxAmount = Math.floor(patrimonio * taxRate);
      if (taxAmount > 0) {
        let remainingTax = taxAmount;
        let newCorriente = user.balance_corriente;
        let newAhorro = user.balance_ahorro;
        
        if (newCorriente >= remainingTax) {
          newCorriente -= remainingTax;
          remainingTax = 0;
        } else {
          remainingTax -= newCorriente;
          newCorriente = 0;
          newAhorro -= remainingTax;
        }
        
        await userModel.updateBalanceCorriente(user.id, newCorriente);
        await userModel.updateBalanceAhorro(user.id, newAhorro);
        
        await transactionModel.createTransaction({
          type: "tax_deduction",
          amount: taxAmount,
          description: "Cobro de impuestos mensual (2% sobre patrimonio)",
          toUserId: null,
          fromUserId: user.id,
          createdBy: req.session.user.id
        });
        
        await notificationService.notifyUser(user.id, "Impuestos cobrados", \`Se te descontó \${taxAmount} por concepto de impuestos.\`, "tax_deduction");
      }
    }
  }
  
  res.json({ ok: true });
});

module.exports = {
  overview,
  userDetail,
  updateUser,
  deleteUser,
  adjustBalance,
  updateCreditScore,
  decideLoan,
  sendNotification,
  sendAnnouncement,
  downloadBackup,
  runTaxes
};
