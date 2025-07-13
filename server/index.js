const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const socketController = require("./socket");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

socketController(io);

httpServer.listen(3001, () => {
  console.log("Server running on port 3001");
});
