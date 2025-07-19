import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { socket } from "../socket";
import type { EnterGameResponse } from "./Lobby";
import TimeUpModal from "../components/TimeUpModal";
import Canvas from "../components/Canvas";
import CorrectGuessModal from "../components/CorrectGuessModal";

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
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-100 overscroll-none via-yellow-50 to-purple-100">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center p-4 bg-white shadow-md">
        <div className="text-xl font-bold text-purple-700">
          Round {gameState.round || 1}
        </div>
        <div className="text-base sm:text-lg font-medium text-gray-600 mt-2 sm:mt-0">
          {isScribbler ? (
            <span>
              Draw:{" "}
              <span className="font-bold text-green-600">{gameState.word}</span>
            </span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="italic text-red-600 text-center">
                Guess the word!
              </span>
              <span className="italic text-red-600 text-xl tracking-widest text-center">
                {gameState?.word
                  ?.split("")
                  .map((char) => {
                    return /[a-zA-Z]/.test(char) ? "_" : char;
                  })
                  .join(" ")}
              </span>
            </div>
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
                {player.score}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas + Guess */}
        <Canvas
          isScribbler={isScribbler}
          socketId={socketId}
          setChatLog={(msg: string) =>
            setChatLog((prev) => [...prev, `[You guessed "${msg}"]`])
          }
        />

        {/* Chat */}
        <div className="lg:w-1/5 w-full p-4 bg-white border-t lg:border-t-0 lg:border-l border-gray-300">
          <h3 className="text-lg font-semibold mb-2 text-blue-600">Chat</h3>
          <div
            ref={chatRef}
            className="h-[100px] sm:h-[300px] overflow-y-auto bg-gray-50 p-2 mb-2 rounded-md"
          >
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
