const authService = require("../services/authService");
const { asyncHandler } = require("../utils/errors");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  req.session.user = user;
  res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  req.session.user = user;
  res.json({ user });
});

function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

function session(req, res) {
  res.json({ user: req.session.user || null });
}

module.exports = { register, login, logout, session };
