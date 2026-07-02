const userModel = require("../models/userModel");
const transactionModel = require("../models/transactionModel");
const notificationService = require("./notificationService");
const { AppError } = require("../utils/errors");
const { parsePositiveAmount } = require("../utils/formatters");

async function transfer({ fromUserId, toCi, amount }) {
  amount = parsePositiveAmount(amount);
  const fromUser = await userModel.findById(fromUserId);
  const toUser = await userModel.findByCi(String(toCi || "").trim().toUpperCase());

  if (!toUser) throw new AppError("No existe un usuario con esa CI.");
  if (toUser.id === fromUser.id) throw new AppError("No puedes transferirte a ti mismo.");
  if (fromUser.balance < amount) throw new AppError("Saldo insuficiente.");

  await userModel.updateBalance(fromUser.id, fromUser.balance - amount);
  await userModel.updateBalance(toUser.id, toUser.balance + amount);
  await transactionModel.createTransaction({
    type: "transfer",
    amount,
    description: `Transferencia de ${fromUser.name} a ${toUser.name}`,
    fromUserId: fromUser.id,
    toUserId: toUser.id,
    createdBy: fromUser.id
  });

  await notificationService.notifyUser(fromUser.id, "Transferencia enviada", `Enviaste ${amount} a ${toUser.name}.`, "transfer_sent");
  await notificationService.notifyUser(toUser.id, "Transferencia recibida", `Recibiste ${amount} de ${fromUser.name}.`, "transfer_received");
}

async function adjustBalance({ adminId, userId, amount, operation }) {
  amount = parsePositiveAmount(amount);
  const user = await userModel.findById(userId);
  if (!user) throw new AppError("Usuario no encontrado.", 404);

  const nextBalance = operation === "remove" ? user.balance - amount : user.balance + amount;
  if (nextBalance < 0) throw new AppError("No se puede dejar el saldo en negativo.");

  await userModel.updateBalance(user.id, nextBalance);
  await transactionModel.createTransaction({
    type: operation === "remove" ? "bank_debit" : "bank_credit",
    amount,
    description: operation === "remove" ? "Dinero quitado por el banco" : "Dinero agregado por el banco",
    toUserId: operation === "remove" ? null : user.id,
    fromUserId: operation === "remove" ? user.id : null,
    createdBy: adminId
  });

  const title = operation === "remove" ? "Dinero quitado por el banco" : "Dinero agregado por el banco";
  await notificationService.notifyUser(user.id, title, `${title}: ${amount}.`, operation === "remove" ? "bank_debit" : "bank_credit");
}

module.exports = { transfer, adjustBalance };
