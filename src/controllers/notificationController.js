const notificationModel = require("../models/notificationModel");
const { asyncHandler } = require("../utils/errors");

const list = asyncHandler(async (req, res) => {
  res.json({ notifications: await notificationModel.listForUser(req.session.user.id) });
});

const markRead = asyncHandler(async (req, res) => {
  await notificationModel.markReadForUser(req.session.user.id);
  res.json({ ok: true });
});

module.exports = { list, markRead };
