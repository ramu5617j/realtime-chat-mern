const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/", protect, upload.single("media"), sendMessage);
router.get("/:chatId", protect, getMessages);

module.exports = router;

