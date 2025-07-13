const { WORDS } = require("./constants/game");

const generateRandomWord = () => {
  const index = Math.floor(Math.random() * WORDS.length);
  return WORDS[index];
};

const socketController = (io) => {
  const room = {};
  const roomWords = {};
  const roomGameState = {};
  const timers = {};

  function getGuessers(roomId, scribblerId) {
    if (!room[roomId]) return [];
    return room[roomId]
      .filter((player) => player.id !== scribblerId)
      .map((player) => player.id);
  }

  const startGameTimer = (io, roomId) => {
    let timeLeft = 60;

    // Clear previous timer if any
    if (timers[roomId]) clearInterval(timers[roomId]);

    timers[roomId] = setInterval(() => {
      timeLeft--;

      io.to(roomId).emit("timerUpdate", { time: timeLeft });

      if (timeLeft <= 0) {
        clearInterval(timers[roomId]);

        io.to(roomId).emit("timeUp", {
          message: "Time's up!",
        });

        moveToNextTurn(io, roomId);
      }
    }, 1000);
  };

  const moveToNextTurn = (io, roomId) => {
    const players = room[roomId];
    if (!players) return;

    const gameState = roomGameState[roomId] || { turnIndex: 0, round: 1 };

    gameState.turnIndex = (gameState.turnIndex + 1) % players.length;

    if (gameState.turnIndex === 0) {
      gameState.round += 1;
    }

    roomGameState[roomId] = gameState;

    const newWord = generateRandomWord();
    roomWords[roomId] = newWord;

    io.to(roomId).emit("gameStarted", {
      success: true,
      word: newWord,
      turnIndex: gameState.turnIndex,
      round: gameState.round,
      message: "Next turn started",
    });

    startGameTimer(io, roomId);
  };

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("createRoom", ({ roomId, name }) => {
      if (room[roomId]) {
        socket.emit("roomExists", {
          success: false,
          message: "Room already exists",
        });
      } else {
        room[roomId] = [{ id: socket.id, name, isHost: true, score: 0 }];
        socket.join(roomId);
        socket.emit("room-created", { success: true, roomId });
        console.log(`Room created: ${roomId}`);
      }
    });

    socket.on("joinRoom", ({ roomId, name }) => {
      if (!room[roomId]) {
        socket.emit("roomNotFound", {
          success: false,
          message: "Room not found",
        });
      } else {
        room[roomId].push({ id: socket.id, name, isHost: false, score: 0 });
        socket.join(roomId);
        io.to(roomId).emit("player-joined", {
          data: room[roomId],
          success: true,
          roomId,
        });
      }
    });

    socket.on("joinLobby", ({ roomId }) => {
      if (room[roomId]) {
        io.to(roomId).emit("lobbyJoined", {
          success: true,
          roomId,
          players: room[roomId],
        });
      } else {
        socket.emit("roomNotFound", {
          success: false,
          message: "Room not found",
        });
      }
    });

    socket.on("enterGame", ({ roomId }) => {
      if (!room[roomId]) {
        return socket.emit("roomNotFound", {
          success: false,
          message: "Room not found",
        });
      }

      const word = generateRandomWord();
      roomWords[roomId] = word;
      roomGameState[roomId] = {
        turnIndex: 0,
        round: 1,
      };

      io.to(roomId).emit("gameStarted", {
        success: true,
        word,
        turnIndex: 0, // corrected `tunIndex` typo
        round: 1,
        message: "Game is starting",
      });

      startGameTimer(io, roomId);
    });

    socket.on("guessWord", ({ roomId, guess, playerId }) => {
      const players = room[roomId];
      const currentPlayer = players?.find((p) => p.id === playerId);
      if (!players || !currentPlayer) return;

      const correctWord = roomWords[roomId];
      const cleanedGuess = guess.trim().toLowerCase();

      if (cleanedGuess === correctWord?.toLowerCase()) {
        io.to(roomId).emit("wordGuessed", {
          success: true,
          playerName: currentPlayer.name,
          word: correctWord,
        });

        currentPlayer.score = (currentPlayer.score || 0) + 1;

        moveToNextTurn(io, roomId);
      } else {
        socket.broadcast.to(roomId).emit("chatMessage", {
          playerName: currentPlayer.name,
          message: guess,
        });
      }
    });

    socket.on("startDraw", ({ roomId, x, y, color }) => {
      const guessers = getGuessers(roomId, socket.id);
      guessers.forEach((socketId) => {
        io.to(socketId).emit("startDraw", { x, y, color });
      });
    });

    socket.on("draw", ({ roomId, x, y, color }) => {
      const guessers = getGuessers(roomId, socket.id);
      guessers.forEach((socketId) => {
        io.to(socketId).emit("draw", { x, y, color });
      });
    });

    socket.on("endDraw", ({ roomId }) => {
      const guessers = getGuessers(roomId, socket.id);
      guessers.forEach((socketId) => {
        io.to(socketId).emit("endDraw");
      });
    });

    socket.on("clearCanvas", ({ roomId }) => {
      socket.to(roomId).emit("clearCanvas");
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      for (const roomId in room) {
        const playerIndex = room[roomId].findIndex(
          (player) => player.id === socket.id
        );

        if (playerIndex !== -1) {
          const playerName = room[roomId][playerIndex].name;
          room[roomId].splice(playerIndex, 1);

          io.to(roomId).emit("player-left", {
            success: true,
            message: `${playerName} has left the room`,
            players: room[roomId],
          });

          if (room[roomId].length === 0) {
            delete room[roomId];
            delete roomWords[roomId];
            delete roomGameState[roomId];
            clearInterval(timers[roomId]);
            delete timers[roomId];
          }

          break;
        }
      }
    });
  });
};

module.exports = socketController;
