import type { Socket } from "socket.io-client";
import io from "socket.io-client";

export const socket: Socket = io("http://localhost:3001", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
});

export const connectSocket = () => {
  socket.on("connect", () => {
    console.log(`Connected to server with ID: ${socket.id}`);
  });
};
