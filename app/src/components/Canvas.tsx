import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useGame } from "../context/GameContext";

type DrawData = {
  x: number;
  y: number;
  color: string;
};
const Canvas = ({
  isScribbler,
  socketId,
  setChatLog,
}: {
  isScribbler: boolean;
  socketId: string | undefined;
  setChatLog: (msg: string) => void;
}) => {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("#000000");
  const [showTools, setShowTools] = useState(false);
  const { gameState } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctxRef.current = ctx;

    clearCanvas();

    socket.on("startDraw", ({ x, y, color }: DrawData) => {
      if (isScribbler) return;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
    });

    socket.on("draw", ({ x, y, color }: DrawData) => {
      if (isScribbler) return;
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on("endDraw", () => {
      ctx.closePath();
    });

    socket.on("clearCanvas", () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      socket.off("startDraw");
      socket.off("draw");
      socket.off("endDraw");
      socket.off("clearCanvas");
    };
  }, [isScribbler]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getTouchPos = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      return {
        clientX: touch.clientX - rect.left,
        clientY: touch.clientY - rect.top,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (!isScribbler) return;

      const touch = e.touches[0];
      const pos = getTouchPos(touch);
      drawing.current = true;

      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(pos.clientX, pos.clientY);

      socket.emit("startDraw", {
        roomId: gameState.roomId,
        x: pos.clientX,
        y: pos.clientY,
        color,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawing.current || !isScribbler) return;

      const touch = e.touches[0];
      const pos = getTouchPos(touch);
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.strokeStyle = color;
      ctx.lineTo(pos.clientX, pos.clientY);
      ctx.stroke();

      socket.emit("draw", {
        roomId: gameState.roomId,
        x: pos.clientX,
        y: pos.clientY,
        color,
      });
    };

    const handleTouchEnd = () => {
      if (!isScribbler) return;
      drawing.current = false;
      socket.emit("endDraw", { roomId: gameState.roomId });
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [color, gameState.roomId, isScribbler]);

  const guessWord = () => {
    if (!message.trim()) return;

    socket.emit("guessWord", {
      roomId: gameState.roomId,
      guess: message,
      playerId: socketId,
    });

    setChatLog(message);
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
  return (
    <div className="relative flex-1 w-full max-w-[640px] mx-auto flex flex-col items-center justify-center px-2 py-4 overflow-hidden">
      {/* Canvas Area */}
      <div className="flex-1 w-full aspect-[4/3] bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden relative">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          className="w-full h-full rounded-xl touch-none"
          onMouseDown={startDraw}
          onMouseMove={handleDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        />
      </div>

      {/* Floating Toggle Button */}
      {isScribbler && (
        <button
          onClick={() => setShowTools((prev) => !prev)}
          className="fixed bottom-24 sm:bottom-8 right-6 z-30 bg-purple-600 hover:bg-purple-700 text-white w-12 h-12 rounded-full shadow-md transition"
          title="Toggle tools"
        >
          🎨
        </button>
      )}

      {/* Bottom Drawer Tools */}
      {isScribbler && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-in-out ${
            showTools ? "translate-y-0" : "translate-y-full"
          } bg-white border-t border-gray-300 shadow-md px-6 py-4 flex justify-between items-center sm:max-w-[640px] sm:mx-auto`}
        >
          <button
            onClick={clearCanvas}
            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition text-sm"
          >
            Clear
          </button>
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer"
            title="Pick color"
          />
        </div>
      )}

      {/* Guess Input (only if not scribbler) */}
      {!isScribbler && (
        <div className="mt-4 flex w-full max-w-[640px] gap-2 px-2">
          <input
            type="text"
            placeholder="Guess the word..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none shadow-sm text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={guessWord}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-green-600 transition"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
