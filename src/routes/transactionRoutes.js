const express = require("express");
const controller = require("../controllers/transactionController");
const { requireFields } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/", controller.myTransactions);
router.post("/transfer", requireFields(["toCi", "amount"]), controller.transfer);
router.post("/internal", requireFields(["fromAccount", "amount"]), controller.internalTransfer);

module.exports = router;
