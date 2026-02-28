import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getSocket } from "../socket";
import API_BASE, { getAuthHeaders } from "../api";
import "./ChatPage.css";

const ChatPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = useMemo(() => getSocket(), []);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => getAuthHeaders(), []);

  useEffect(() => {
    if (!token) {
      onLogout?.();
      navigate("/login", { replace: true });
      return;
    }
  }, [token, navigate, onLogout]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/chats`, { headers: authHeaders });
        setChats(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          onLogout?.();
          navigate("/login", { replace: true });
        }
      }
    };
    if (token) fetchChats();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/chats/users`, { headers: authHeaders });
        setUsers(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          onLogout?.();
          navigate("/login", { replace: true });
        } else {
          setUsers([]);
        }
      } finally {
        setUsersLoading(false);
      }
    };
    if (showNewChat || showNewRoom) fetchUsers();
  }, [showNewChat, showNewRoom, authHeaders, navigate, onLogout]);

  useEffect(() => {
    if (!activeChat) return;
    socket.emit("join room", activeChat._id);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/messages/${activeChat._id}`,
          { headers: authHeaders }
        );
        setMessages(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          onLogout?.();
          navigate("/login", { replace: true });
        }
      }
    };
    fetchMessages();
  }, [activeChat, socket, authHeaders, navigate, onLogout]);

  useEffect(() => {
    const handler = (msg) => {
      if (activeChat && msg.chat && msg.chat.toString() === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("message received", handler);
    return () => socket.off("message received", handler);
  }, [socket, activeChat]);

  useEffect(() => {
    socket.on("typing", () => setTypingUser("Someone"));
    socket.on("stop typing", () => setTypingUser(null));
    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeChat || (!text.trim() && !file)) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("chatId", activeChat._id);
      if (text.trim()) formData.append("content", text.trim());
      if (file) formData.append("media", file);

      const res = await axios.post(`${API_BASE}/api/messages`, formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });

      const savedMsg = {
        ...res.data,
        chat: activeChat._id,
      };
      setMessages((prev) => [...prev, savedMsg]);
      socket.emit("new message", savedMsg);
      setText("");
      setFile(null);

      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === activeChat._id);
        if (idx === -1) return prev;
        const updated = [...prev];
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        return updated;
      });
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout?.();
        navigate("/login", { replace: true });
      } else console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (!activeChat) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", activeChat._id);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", activeChat._id);
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const createPrivateChat = async (targetUser) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/chats`,
        { userId: targetUser._id },
        { headers: authHeaders }
      );
      setChats((prev) => [res.data, ...prev.filter((c) => c._id !== res.data._id)]);
      setActiveChat(res.data);
      setShowNewChat(false);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout?.();
        navigate("/login", { replace: true });
      } else console.error(err);
    }
  };

  const createGroupRoom = async () => {
    if (!roomName.trim() || selectedUsers.length === 0) return;
    try {
      const res = await axios.post(
        `${API_BASE}/api/chats/group`,
        { name: roomName.trim(), userIds: selectedUsers },
        { headers: authHeaders }
      );
      setChats((prev) => [res.data, ...prev]);
      setActiveChat(res.data);
      setShowNewRoom(false);
      setRoomName("");
      setSelectedUsers([]);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout?.();
        navigate("/login", { replace: true });
      } else console.error(err);
    }
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getChatDisplayName = (chat) => {
    if (chat.isGroupChat) return chat.name;
    const other = chat.users?.find((u) => u._id !== user?._id);
    return other?.name || "Unknown";
  };

  const handleLogout = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  if (!user) {
    return (
      <div className="chat-layout" style={{ alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#8a8fa3" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Chats</h2>
          <span className="sidebar-user">{user.name}</span>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="sidebar-actions">
          <button
            type="button"
            className="action-btn"
            onClick={() => { setShowNewChat(true); setShowNewRoom(false); }}
          >
            + New Chat
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => { setShowNewRoom(true); setShowNewChat(false); }}
          >
            + New Room
          </button>
        </div>

        {showNewChat && (
          <div
            className="modal-overlay"
            onClick={() => setShowNewChat(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Escape" && setShowNewChat(false)}
            aria-label="Close modal"
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Start private chat</h3>
              {usersLoading ? (
                <p className="modal-empty">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="modal-empty">
                  No other users yet. Register a second account (e.g. in an incognito window) to start chatting.
                </p>
              ) : (
                <ul className="user-list">
                  {users.map((u) => (
                    <li key={u._id} onClick={() => createPrivateChat(u)} className="user-item">
                      {u.name} ({u.email})
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="close-btn" onClick={() => setShowNewChat(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showNewRoom && (
          <div
            className="modal-overlay"
            onClick={() => { setShowNewRoom(false); setRoomName(""); setSelectedUsers([]); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Escape") { setShowNewRoom(false); setRoomName(""); setSelectedUsers([]); } }}
            aria-label="Close modal"
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Create chat room</h3>
              <input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="modal-input"
              />
              {usersLoading ? (
                <p className="modal-empty">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="modal-empty">
                  No other users yet. Register a second account (e.g. in an incognito window) to add to the room.
                </p>
              ) : (
                <ul className="user-list">
                  {users.map((u) => (
                    <li
                      key={u._id}
                      onClick={() => toggleUser(u._id)}
                      className={`user-item ${selectedUsers.includes(u._id) ? "selected" : ""}`}
                    >
                      {u.name} ({u.email})
                    </li>
                  ))}
                </ul>
              )}
              <div className="modal-buttons">
                <button type="button" className="close-btn" onClick={() => { setShowNewRoom(false); setRoomName(""); setSelectedUsers([]); }}>Cancel</button>
                <button
                  type="button"
                  className="create-btn"
                  onClick={createGroupRoom}
                  disabled={!roomName.trim() || selectedUsers.length === 0}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        <ul className="chat-list">
          {chats.map((chat) => (
            <li
              key={chat._id}
              onClick={() => setActiveChat(chat)}
              className={`chat-item ${activeChat?._id === chat._id ? "active" : ""}`}
            >
              <span className="chat-avatar">{getChatDisplayName(chat).charAt(0)}</span>
              <div className="chat-info">
                <span className="chat-name">{getChatDisplayName(chat)}</span>
                {chat.isGroupChat && <span className="chat-badge">Group</span>}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        {activeChat ? (
          <>
            <header className="chat-header">
              <span className="chat-header-name">{getChatDisplayName(activeChat)}</span>
              {activeChat.isGroupChat && <span className="chat-header-badge">Group</span>}
            </header>

            <div className="messages-container">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`message ${m.sender?._id === user?._id ? "own" : ""}`}
                >
                  <span className="msg-sender">{m.sender?.name || "User"}</span>
                  {m.content && <p className="msg-content">{m.content}</p>}
                  {m.media && (
                    <a href={`${API_BASE}${m.media}`} target="_blank" rel="noopener noreferrer">
                      <img src={`${API_BASE}${m.media}`} alt="attachment" className="msg-media" />
                    </a>
                  )}
                  <span className="msg-time">
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              ))}
              {typingUser && <div className="typing-indicator">{typingUser} typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-form" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => { setText(e.target.value); handleTyping(); }}
                className="message-input"
              />
              <label className="file-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                📎
              </label>
              {file && <span className="file-name">{file.name}</span>}
              <button type="submit" className="send-btn" disabled={loading || (!text.trim() && !file)}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Select a chat or create a new one</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
