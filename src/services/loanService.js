const loanModel = require("../models/loanModel");
const userModel = require("../models/userModel");
const transactionModel = require("../models/transactionModel");
const notificationService = require("./notificationService");
const { AppError } = require("../utils/errors");
const { parsePositiveAmount } = require("../utils/formatters");

async function requestLoan(userId, amount) {
  amount = parsePositiveAmount(amount);
  const result = await loanModel.createLoan({ userId, amount });
  await notificationService.notifyAdmins("Nueva solicitud de prestamo", `El usuario ${userId} solicito ${amount}.`, "loan_pending");
  return result;
}

async function adminDecision({ loanId, approve, interestRate }) {
  const loan = await loanModel.findById(loanId);
  if (!loan) throw new AppError("Prestamo no encontrado.", 404);
  if (loan.status !== "pending_admin") throw new AppError("Este prestamo ya fue revisado.");

  if (!approve) {
    await loanModel.updateAdminDecision(loanId, { status: "rejected_admin", interestRate: null });
    await notificationService.notifyUser(loan.user_id, "Prestamo rechazado", "El banco rechazo tu solicitud de prestamo.", "loan_rejected");
    return;
  }

  const rate = Number(interestRate);
  if (!Number.isFinite(rate) || rate < 0) throw new AppError("El interes debe ser un numero igual o mayor a cero.");
  await loanModel.updateAdminDecision(loanId, { status: "pending_user", interestRate: rate });
  await notificationService.notifyUser(
    loan.user_id,
    "Prestamo aprobado",
    `El banco aprobo tu prestamo de ${loan.amount} con ${rate}% de interes. Debes aceptarlo o rechazarlo.`,
    "loan_approved"
  );
}

async function userDecision({ userId, loanId, accept }) {
  const loan = await loanModel.findById(loanId);
  if (!loan || loan.user_id !== userId) throw new AppError("Prestamo no encontrado.", 404);
  if (loan.status !== "pending_user") throw new AppError("Este prestamo no esta pendiente de respuesta.");

  if (!accept) {
    await loanModel.updateUserDecision(loanId, "rejected_user");
    await notificationService.notifyAdmins("Prestamo rechazado por usuario", `${loan.user_name} rechazo el prestamo.`, "loan_rejected");
    return;
  }

  const user = await userModel.findById(userId);
  await userModel.updateBalance(userId, user.balance + loan.amount);
  await loanModel.updateUserDecision(loanId, "approved");
  await transactionModel.createTransaction({
    type: "loan_disbursement",
    amount: loan.amount,
    description: `Prestamo aceptado con ${loan.interest_rate}% de interes`,
    toUserId: userId,
    createdBy: userId
  });
  await notificationService.notifyUser(userId, "Prestamo depositado", `Se agregaron ${loan.amount} a tu saldo.`, "loan_disbursed");
}

module.exports = { requestLoan, adminDecision, userDecision };
