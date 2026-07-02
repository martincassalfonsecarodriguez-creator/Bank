function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === "");
    if (missing.length) return res.status(400).json({ error: `Faltan campos: ${missing.join(", ")}.` });
    next();
  };
}

module.exports = { requireFields };
