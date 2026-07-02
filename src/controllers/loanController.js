const loanModel = require("../models/loanModel");
const loanService = require("../services/loanService");
const { asyncHandler } = require("../utils/errors");

const requestLoan = asyncHandler(async (req, res) => {
  const result = await loanService.requestLoan(req.session.user.id, req.body.amount);
  res.status(201).json({ id: result.id });
});

const myLoans = asyncHandler(async (req, res) => {
  res.json({ loans: await loanModel.listForUser(req.session.user.id) });
});

const respondToLoan = asyncHandler(async (req, res) => {
  await loanService.userDecision({ userId: req.session.user.id, loanId: req.params.id, accept: Boolean(req.body.accept) });
  res.json({ ok: true });
});

module.exports = { requestLoan, myLoans, respondToLoan };
