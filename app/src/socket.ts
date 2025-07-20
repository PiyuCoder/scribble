import io, { Socket } from "socket.io-client";

const url = "https://scribble-bmrv.onrender.com";
// const url = "http://localhost:3001";

export const socket: Socket = io(url, {
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
