import { io } from "socket.io-client";

const ENDPOINT = "http://localhost:5000";
let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(ENDPOINT);
  }
  return socket;
};
