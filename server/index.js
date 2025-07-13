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

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
