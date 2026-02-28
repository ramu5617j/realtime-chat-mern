const Chat = require("../models/Chat");
const User = require("../models/User");

const createOrGetOneToOneChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId is required" });
  }

  try {
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, userId] },
    }).populate("users", "-password");

    if (!chat) {
      chat = await Chat.create({
        name: "Direct Chat",
        isGroupChat: false,
        users: [req.user._id, userId],
      });
      chat = await chat.populate("users", "-password");
    }

    return res.json(chat);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "-password")
      .sort({ updatedAt: -1 });

    return res.json(chats);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const createGroupChat = async (req, res) => {
  const { name, userIds } = req.body;

  if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "Name and userIds array required" });
  }

  try {
    const users = [req.user._id, ...userIds];
    const chat = await Chat.create({
      name,
      isGroupChat: true,
      users,
    });
    const populated = await chat.populate("users", "-password");
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password"
    );
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createOrGetOneToOneChat,
  getUserChats,
  createGroupChat,
  getAllUsers,
};

