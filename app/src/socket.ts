import io, { Socket } from "socket.io-client";

const prodUrl = "https://scribble-bmrv.onrender.com";
// const devUrl = "http://localhost:3001";

export const socket: Socket = io(prodUrl, {
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
