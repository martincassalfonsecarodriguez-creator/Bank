const path = require("path");
const express = require("express");
const helmet = require("helmet");
const config = require("./config/env");
const sessionMiddleware = require("./config/session");
const { requireAuth } = require("./middleware/authMiddleware");
const { requireAdmin } = require("./middleware/adminMiddleware");
const { errorHandler } = require("./utils/errors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const loanRoutes = require("./routes/loanRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.json());
app.use(sessionMiddleware);
app.use(express.static(path.join(config.rootDir, "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Banco Familiar" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", requireAuth, userRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/loans", requireAuth, loanRoutes);
app.use("/api/notifications", requireAuth, notificationRoutes);
app.use("/api/admin", requireAdmin, adminRoutes);

app.use(errorHandler);

module.exports = { app, sessionMiddleware };
