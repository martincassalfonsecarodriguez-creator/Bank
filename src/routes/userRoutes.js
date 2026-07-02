const express = require("express");
const controller = require("../controllers/userController");

const router = express.Router();

router.get("/profile", controller.profile);
router.get("/dashboard", controller.dashboard);
router.get("/ranking", controller.ranking);
router.get("/credit-score/history", controller.creditScoreHistory);

module.exports = router;
