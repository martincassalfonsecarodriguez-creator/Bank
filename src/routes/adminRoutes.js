const express = require("express");
const controller = require("../controllers/adminController");
const { requireFields } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/overview", controller.overview);
router.get("/backup", controller.downloadBackup);
router.get("/users/:id", controller.userDetail);
router.put("/users/:id", requireFields(["name", "ci", "role"]), controller.updateUser);
router.delete("/users/:id", controller.deleteUser);
router.post("/users/:id/balance", requireFields(["amount", "operation"]), controller.adjustBalance);
router.post("/users/:id/notification", requireFields(["message"]), controller.sendNotification);
router.post("/loans/:id/decision", controller.decideLoan);
router.post("/announcements", requireFields(["message"]), controller.sendAnnouncement);

module.exports = router;
