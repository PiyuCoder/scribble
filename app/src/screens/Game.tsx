import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { socket } from "../socket";
import type { EnterGameResponse } from "./Lobby";

type DrawData = {
  x: number;
  y: number;
  color: string;
};

const Game = () => {
  const { gameState, setGameState } = useGame();
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState("#000000");
  // const [isErasing, setIsErasing] = useState(false);
  const drawing = useRef(false);
  const socketId = socket.id;
  const currentScribbler = gameState.players?.[gameState.turnIndex || 0];
  const isScribbler = currentScribbler?.id === socketId;

  const guessWord = () => {
    if (!message.trim()) return;

    socket.emit("guessWord", {
      roomId: gameState.roomId,
      guess: message,
      playerId: socketId,
    });

    setChatLog((prev) => [...prev, `[You guessed "${message}"]`]);
    setMessage("");
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit("clearCanvas", { roomId: gameState.roomId });
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    // setIsErasing(false);
  };

  // const toggleEraser = () => {
  //   setIsErasing((prev) => !prev);
  // };

  useEffect(() => {
    socket.on(
      "wordGuessed",
      (response: { playerName: string; word: string }) => {
        setChatLog((prev) => [
          ...prev,
          `[${response.playerName} guessed the word correctly: "${response.word}" 🎉]`,
        ]);
      }
    );

    socket.on(
      "chatMessage",
      (response: { playerName: string; message: string }) => {
        setChatLog((prev) => [
          ...prev,
          `[${response.playerName}]: ${response.message}`,
        ]);
      }
    );

    socket.on("gameStarted", (response: EnterGameResponse) => {
      setGameState((prev) => ({
        ...prev,
        word: response.word!,
        round: response.round,
        turnIndex: response.turnIndex,
        gameStatus: "playing",
      }));
    });

    socket.on("clearCanvas", () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    socket.on("timerUpdate", ({ time }: { time: number }) => {
      setGameState((prev) => ({
        ...prev,
        timer: time,
      }));
    });

    socket.on("timeUp", ({ message }: { message: string }) => {
      setChatLog((prev) => [...prev, `[⏰] ${message}`]);
    });

    return () => {
      socket.off("wordGuessed");
      socket.off("chatMessage");
      socket.off("gameStarted");
      socket.off("clearCanvas");
      socket.off("timerUpdate");
      socket.off("timeUp");
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctxRef.current = ctx;
    }
  }, []);

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !isScribbler) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();

    // 🛰 Send to others
    socket.emit("draw", {
      roomId: gameState.roomId,
      x,
      y,
      color,
    });
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScribbler) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) return;

    drawing.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);

    socket.emit("startDraw", {
      roomId: gameState.roomId,
      x,
      y,
      color,
    });
  };

  const endDraw = () => {
    if (!isScribbler) return;
    drawing.current = false;
    socket.emit("endDraw", { roomId: gameState.roomId });
  };

  // 🧩 Listen to draw from others
  useEffect(() => {
    if (isScribbler) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    socket.on("startDraw", ({ x, y, color }: DrawData) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
    });

    socket.on("draw", ({ x, y, color }: DrawData) => {
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on("endDraw", () => {
      ctx.closePath();
    });

    return () => {
      socket.off("startDraw");
      socket.off("draw");
      socket.off("endDraw");
    };
  }, [isScribbler]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-100 overscroll-none via-yellow-50 to-purple-100">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center p-4 bg-white shadow-md">
        <div className="text-xl font-bold text-purple-700">
          Round {gameState.round || 1}
        </div>
        <div className="text-base sm:text-lg font-medium text-gray-600 mt-2 sm:mt-0">
          {isScribbler ? (
            <span>
              You are drawing:{" "}
              <span className="font-bold text-green-600">{gameState.word}</span>
            </span>
          ) : (
            <span className="italic text-red-600">Guess the word!</span>
          )}
        </div>
        <div className="text-base sm:text-lg font-mono text-blue-600 mt-2 sm:mt-0">
          ⏱ {gameState.timer || 60}s
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Players */}
        <div className="lg:w-1/5 w-full p-4 bg-white border-b lg:border-b-0 lg:border-r border-gray-300">
          <h3 className="text-lg font-semibold mb-3 text-purple-600">
            Players
          </h3>
          <div className="gap-2 flex">
            {gameState.players?.map((player) => (
              <div
                key={player.id}
                className={`p-2 rounded-md shadow-sm text-sm ${
                  player.id === currentScribbler?.id
                    ? "bg-purple-200 font-bold"
                    : "bg-gray-100"
                }`}
              >
                {player.name}
                {player.id === currentScribbler?.id && " ✏️"}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas + Guess */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-white border-2 border-gray-400 rounded-md shadow-lg w-full max-w-[600px] h-[300px] sm:h-[400px] mb-6">
            <canvas
              ref={canvasRef}
              id="gameCanvas"
              className="w-full h-full"
              onMouseDown={startDraw}
              onMouseMove={handleDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                startDraw({
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                } as any);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                handleDraw({
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                } as any);
              }}
              onTouchEnd={endDraw}
            />
            {isScribbler && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={clearCanvas}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Clear
                </button>
                {/* <button
                onClick={toggleEraser}
                className={`${
                  isErasing ? "bg-gray-800" : "bg-gray-300"
                } text-white px-3 py-1 rounded`}
              >
                {isErasing ? "Erasing..." : "Eraser"}
              </button> */}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-10 h-10 border-2 border-gray-400 rounded-full cursor-pointer"
                />
              </div>
            )}
          </div>

          {!isScribbler && (
            <div className="flex gap-2 w-full max-w-[600px] px-2">
              <input
                type="text"
                placeholder="Guess the word..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={guessWord}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:w-1/5 w-full p-4 bg-white border-t lg:border-t-0 lg:border-l border-gray-300">
          <h3 className="text-lg font-semibold mb-2 text-blue-600">Chat</h3>
          <div className="h-[100px] sm:h-[300px] overflow-y-auto bg-gray-50 p-2 mb-2 rounded-md">
            {chatLog.map((msg, idx) => (
              <p key={idx} className="text-sm text-gray-700">
                {msg}
              </p>
            ))}
          </div>
          <div className="text-sm text-gray-400 italic">
            {isScribbler ? "You're the artist this round 🎨" : "Keep guessing!"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
