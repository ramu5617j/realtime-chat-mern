const Message = require("../models/Message");
const Chat = require("../models/Chat");

const sendMessage = async (req, res) => {
  const content = req.body.content || "";
  const chatId = req.body.chatId;
  const mediaFile = req.file;

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }
  if (!content && !mediaFile) {
    return res.status(400).json({ message: "Content or media required" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      media: mediaFile ? `/uploads/${mediaFile.filename}` : "",
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "name email avatar")
      .lean();

    chat.updatedAt = new Date();
    await chat.save();

    return res.status(201).json({ ...populated, chat: chatId });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { sendMessage, getMessages };

