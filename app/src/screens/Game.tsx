import { useEffect, useRef, useState } from "react";
import { useGame, type Player } from "../context/GameContext";
import { socket } from "../socket";
import type { EnterGameResponse } from "./Lobby";
import TimeUpModal from "../components/TimeUpModal";
import Canvas from "../components/Canvas";
import CorrectGuessModal from "../components/CorrectGuessModal";
import Avatar from "../components/Avatar";

const Game = () => {
  const { gameState, setGameState } = useGame();
  const [chatLog, setChatLog] = useState<string[]>([]);

  const [timeUpModal, setTimeUpModal] = useState(false);
  const [guessedModal, setGuessedModal] = useState(false);
  const [nextPlayer, setNextPlayer] = useState("");
  const [correctGuesser, setCorrectGuesser] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const socketId = socket.id;
  const currentScribbler = gameState.players?.[gameState.turnIndex || 0];
  const isScribbler = currentScribbler?.id === socketId;

  // const toggleEraser = () => {
  //   setIsErasing((prev) => !prev);
  // };

  useEffect(() => {
    socket.on(
      "wordGuessed",
      (response: { playerName: string; word: string; nextPlayer: string }) => {
        setChatLog((prev) => [
          ...prev,
          `[${response.playerName} guessed the word correctly: "${response.word}" 🎉]`,
        ]);
        setCorrectGuesser(response.playerName);
        setNextPlayer(response.nextPlayer);

        setGuessedModal(true);
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
        players: prev?.players?.map((player) => {
          const updatedScore =
            response?.scores?.find((p) => p.id === player.id)?.score ??
            player.score;
          return { ...player, score: updatedScore };
        }),
        word: response.word!,
        round: response.round,
        turnIndex: response.turnIndex,
        gameStatus: "playing",
      }));
    });

    socket.on("timerUpdate", ({ time }: { time: number }) => {
      setGameState((prev) => ({
        ...prev,
        timer: time,
      }));
    });

    socket.on(
      "timeUpModal",
      ({ message, nextPlayer }: { message: string; nextPlayer: string }) => {
        console.log("⏰ timeUpModal received", message);
        setChatLog((prev) => [...prev, `[⏰] ${message}`]);
        setNextPlayer(nextPlayer);
        setTimeUpModal(true);
      }
    );

    socket.on("closeModal", () => {
      setTimeUpModal(false);
      setNextPlayer("");
    });

    socket.on("closeGuessedModal", () => {
      setGuessedModal(false);
      setCorrectGuesser("");
      setNextPlayer("");
    });

    socket.on(
      "player-left",
      (response: { playerName: string; players: Player[] }) => {
        setChatLog((prev) => [
          ...prev,
          `[${response.playerName} has left the game]`,
        ]);
        setGameState((prev) => ({
          ...prev,
          players: response.players,
        }));
      }
    );

    return () => {
      socket.off("wordGuessed");
      socket.off("chatMessage");
      socket.off("gameStarted");
      socket.off("timerUpdate");
      socket.off("timeUpModal");
      socket.off("closeModal");
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-pink-100 via-yellow-50 to-blue-100 text-sm sm:text-base font-[Inter]">
      {/* 🎮 Top Bar */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-2 bg-white/90 backdrop-blur border-b border-gray-300 shadow-sm">
        <div className="font-bold text-purple-700 tracking-tight">
          🎯 Round{" "}
          <span className="text-purple-900">{gameState.round || 1}</span>
        </div>

        <div className="text-blue-600 font-mono flex items-center gap-1">
          <span className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />⏱{" "}
          {gameState.timer || 60}s
        </div>
      </div>
      <div className="flex flex-col items-center text-center">
        {isScribbler ? (
          <span className="text-green-600 font-semibold animate-pulse">
            🎨 Draw: <span className="text-lg">{gameState.word}</span>
          </span>
        ) : (
          <>
            <span className="text-red-500 italic">🤔 Guess the word!</span>
            <span className="tracking-widest text-red-600 font-mono text-lg">
              {gameState?.word
                ?.split("")
                .map((char) => (/[a-zA-Z]/.test(char) ? "_" : char))
                .join(" ")}
            </span>
          </>
        )}
      </div>

      {/* 🎨 Main Area */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center px-2 py-3 sm:p-4">
          <div className="w-full max-w-[650px] bg-white border-[3px] border-dashed border-purple-300 rounded-xl shadow-2xl p-2 sm:p-4 transition-all duration-300">
            <Canvas
              isScribbler={isScribbler}
              socketId={socketId}
              setChatLog={(msg: string) =>
                setChatLog((prev) => [...prev, `[You guessed \"${msg}\"]`])
              }
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full sm:w-[270px] flex flex-col border-t sm:border-t-0 sm:border-l border-gray-300 bg-white/90 backdrop-blur">
          {/* 👥 Players */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-purple-700 mb-2">
              👥 Players
            </h3>
            <div className="flex flex-wrap gap-2">
              {gameState.players?.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm shadow-sm whitespace-nowrap font-medium transition ${
                    player.id === currentScribbler?.id
                      ? "bg-purple-200 text-purple-900"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <Avatar avatarSrc={player.avatar} size="w-4 h-4" />
                  {player.name} {player.id === currentScribbler?.id && "✏️"}
                  <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-[1px] rounded-full font-semibold">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 📨 Chat — kept exactly as you have it */}
          <div className="flex-1 p-3 flex flex-col min-h-0">
            <h3 className="text-md font-semibold text-blue-600 mb-2">Chat</h3>
            <div
              ref={chatRef}
              className="h-[100px] overflow-y-auto space-y-2 pr-1 pb-10"
            >
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 text-gray-800 text-sm break-words"
                >
                  {msg}
                </div>
              ))}
            </div>

            <div className="mt-2 text-xs italic text-gray-400 text-center">
              {isScribbler ? "You're the artist this round 🎨" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* 🎉 Modals */}
      {timeUpModal && <TimeUpModal nextPlayerName={nextPlayer} />}
      {guessedModal && (
        <CorrectGuessModal
          guesserName={correctGuesser || "Someone"}
          nextPlayerName={nextPlayer}
          word={gameState.word || ""}
        />
      )}
    </div>
  );
};

export default Game;
