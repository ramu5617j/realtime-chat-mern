## Chat App (MERN + Socket.IO)

This project is a **real-time chat application** built with the MERN stack and Socket.IO.  
It supports **JWT authentication**, **private chats**, **group rooms**, **media uploads**, and **persistent chat history**.

### Tech Stack & Versions

- **Node.js**: 20.x or later (recommended)
- **Backend**
  - `express` ^5.2.1
  - `mongoose` ^9.2.2
  - `socket.io` ^4.8.3
  - `bcryptjs` ^3.0.3
  - `jsonwebtoken` ^9.0.3
  - `multer` ^2.0.2
  - `cors` ^2.8.6
  - `dotenv` ^17.3.1
- **Frontend**
  - `react` ^19.2.4
  - `react-dom` ^19.2.4
  - `react-router-dom` ^6 (installed via project)
  - `axios` latest
  - `socket.io-client` latest

> Make sure you have **Node.js** and **npm** installed before starting.

### Project Structure

```text
projass/
  backend/       # Node/Express API + Socket.IO + MongoDB
  frontend/      # React SPA (login, register, chat UI)
  README.md
```

---

## 1. Backend Setup (Node + Express + MongoDB)

### 1.1. Environment

Create `backend/.env` (already present, verify values):

```env
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.3m7uqrr.mongodb.net/learn"
JWT_SECRET=supersecretjwtkey
PORT=5000
```

Replace `<username>` and `<password>` with your own MongoDB Atlas credentials if needed.

### 1.2. Install Dependencies

From the project root:

```bash
cd backend
npm install
```

### 1.3. Run Backend

```bash
npm start
```

The server should start on `http://localhost:5000` and log **"MongoDB Connected"**.

---

## 2. Frontend Setup (React)

### 2.1. Install Dependencies

From the project root:

```bash
cd frontend
npm install
```

This installs React, React Router, Axios, Socket.IO client, and test utilities.

### 2.2. Run Frontend

```bash
npm start
```

The React app will be available at `http://localhost:3000`.

> Ensure the backend is running on port **5000** so the frontend can call the APIs.

---

## 3. Core Features

- **Authentication**
  - Register and Login pages (JWT-based).
  - Tokens stored in `localStorage`; protected routes on the frontend.

- **Real-Time Chat**
  - Socket.IO connection from React to the Node server.
  - Rooms per chat/room; typing indicator; instant message updates.

- **Private & Group Chats**
  - Create one-to-one chats with users.
  - Create named group rooms with multiple users.

- **Media Uploads**
  - Image uploads via `multer` to `backend/uploads`.
  - File paths stored in the `Message` model, rendered in the UI.

- **Chat History**
  - Messages stored in MongoDB with timestamps.
  - `GET /api/messages/:chatId` loads previous messages on room open.

---

## 4. Running the Full Stack Locally

1. **Start backend** (in one terminal):
   ```bash
   cd backend
   npm start
   ```
2. **Start frontend** (in another terminal):
   ```bash
   cd frontend
   npm start
   ```
3. Open `http://localhost:3000` in your browser.
4. Register two users (you can use an incognito/private window for the second user) to test real-time chat between accounts.

---


