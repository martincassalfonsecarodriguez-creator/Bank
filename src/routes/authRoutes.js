const express = require("express");
const controller = require("../controllers/authController");
const { requireFields } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/session", controller.session);
router.post("/register", requireFields(["name", "ci", "password"]), controller.register);
router.post("/login", requireFields(["ci", "password"]), controller.login);
router.post("/logout", controller.logout);

module.exports = router;
