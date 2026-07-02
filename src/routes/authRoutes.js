const express = require("express");
const controller = require("../controllers/authController");
const { requireFields } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/session", controller.session);
router.get("/terms", controller.getTerms);
router.post("/terms/accept", requireFields(["version"]), controller.acceptTerms);
router.post("/register", requireFields(["name", "ci", "password"]), controller.register);
router.post("/login", requireFields(["ci", "password"]), controller.login);
router.post("/reset-password", requireFields(["ci", "newPassword", "masterCode"]), controller.resetPassword);
router.post("/logout", controller.logout);

module.exports = router;
