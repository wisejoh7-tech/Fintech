import { io, Socket } from "socket.io-client";
import { getApiUrl } from "./api";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const url = getApiUrl("");
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
};

export const useSocket = (userId?: string) => {
  const s = getSocket();

  if (userId) {
    s.emit("join", userId);
  }

  return s;
};
