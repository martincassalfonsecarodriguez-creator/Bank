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

const getTerms = asyncHandler(async (req, res) => {
  const terms = await authService.getLatestTerms();
  res.json(terms);
});

const acceptTerms = asyncHandler(async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "No autorizado" });
  await authService.acceptTerms(req.session.user.id, req.body.version);
  req.session.user.accepted_terms_version = req.body.version;
  res.json({ ok: true });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ ok: true });
});

module.exports = { register, login, logout, session, getTerms, acceptTerms, resetPassword };
