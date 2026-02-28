const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createOrGetOneToOneChat,
  getUserChats,
  createGroupChat,
  getAllUsers,
} = require("../controllers/chatController");

const router = express.Router();

router.post("/", protect, createOrGetOneToOneChat);
router.post("/group", protect, createGroupChat);
router.get("/", protect, getUserChats);
router.get("/users", protect, getAllUsers);

module.exports = router;

