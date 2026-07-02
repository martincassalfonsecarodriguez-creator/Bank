const bankService = require("../services/bankService");
const transactionModel = require("../models/transactionModel");
const { asyncHandler } = require("../utils/errors");

const transfer = asyncHandler(async (req, res) => {
  await bankService.transfer({ fromUserId: req.session.user.id, toCi: req.body.toCi, amount: req.body.amount });
  res.json({ ok: true });
});

const myTransactions = asyncHandler(async (req, res) => {
  res.json({ transactions: await transactionModel.listForUser(req.session.user.id) });
});

const internalTransfer = asyncHandler(async (req, res) => {
  await bankService.internalTransfer({
    userId: req.session.user.id,
    fromAccount: req.body.fromAccount,
    amount: req.body.amount
  });
  res.json({ ok: true });
});

module.exports = { transfer, myTransactions, internalTransfer };
