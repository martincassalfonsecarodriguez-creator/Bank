const express = require("express");
const controller = require("../controllers/userController");

const router = express.Router();

router.get("/profile", controller.profile);
router.get("/dashboard", controller.dashboard);

module.exports = router;
