const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const socketController = require("./socket");
const path = require("path");

const app = express();

app.use("/", express.static(path.join(__dirname, "dist")));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

socketController(io);

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

httpServer.listen(3001, () => {
  console.log("Server running on port 3001");
});
