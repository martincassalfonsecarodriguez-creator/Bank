const userModel = require("../models/userModel");
const transactionModel = require("../models/transactionModel");
const loanModel = require("../models/loanModel");
const notificationModel = require("../models/notificationModel");
const { asyncHandler } = require("../utils/errors");
const { publicUser } = require("../utils/formatters");

const profile = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.session.user.id);
  req.session.user = publicUser(user);
  res.json({ user: req.session.user });
});

const dashboard = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const [user, transactions, loans, notifications] = await Promise.all([
    userModel.findById(userId),
    transactionModel.listForUser(userId),
    loanModel.listForUser(userId),
    notificationModel.listForUser(userId)
  ]);
  req.session.user = publicUser(user);
  res.json({ user: req.session.user, transactions, loans, notifications });
});

module.exports = { profile, dashboard };
