const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config.db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("join room", (roomId) => {
    socket.join(String(roomId));
  });

  socket.on("typing", (roomId) => {
    socket.to(String(roomId)).emit("typing");
  });

  socket.on("stop typing", (roomId) => {
    socket.to(String(roomId)).emit("stop typing");
  });

  socket.on("new message", (newMessage) => {
    const roomId = newMessage.chat;
    socket.to(roomId.toString()).emit("message received", newMessage);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

