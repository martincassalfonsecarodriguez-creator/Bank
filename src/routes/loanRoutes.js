const express = require("express");
const controller = require("../controllers/loanController");
const { requireFields } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/", controller.myLoans);
router.post("/", requireFields(["amount"]), controller.requestLoan);
router.post("/:id/respond", requireFields(["accept"]), controller.respondToLoan);

module.exports = router;
