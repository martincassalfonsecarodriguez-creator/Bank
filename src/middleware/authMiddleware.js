function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Debes iniciar sesion." });
  next();
}

module.exports = { requireAuth };
