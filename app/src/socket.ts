import io, { Socket } from "socket.io-client";

export const socket: Socket = io("https://scribble-bmrv.onrender.com", {
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
