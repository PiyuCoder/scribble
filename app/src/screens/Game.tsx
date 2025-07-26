import { useEffect, useRef, useState } from "react";
import { useGame, type Player } from "../context/GameContext";
import { socket } from "../socket";
import type { EnterGameResponse } from "./Lobby";
import TimeUpModal from "../components/TimeUpModal";
import Canvas from "../components/Canvas";
import CorrectGuessModal from "../components/CorrectGuessModal";
import Avatar from "../components/Avatar";

type EmojiEffect = {
  emoji: string;
  sender: string;
};

const EMOJIS = [
  "😂",
  "🔥",
  "💡",
  "😲",
  "👏",
  "💩",
  "😍",
  "🥰",
  "❤️",
  "💖",
  "💘",
  "🌹",
  "😎",
  "🤯",
  "🤡",
  "🥳",
  "😭",
  "😡",
  "🤬",
  "🤓",
  "👻",
  "😈",
  "🙄",
  "😴",
  "🙃",
  "😅",
  "💀",
  "😜",
  "🫶",
  "🎉",
  "💥",
  "🍕",
  "🍺",
  "🎯",
  "🧠",
  "🐒",
];

const Game = () => {
  const { gameState, setGameState } = useGame();
  const [chatLog, setChatLog] = useState<string[]>([]);

  const [timeUpModal, setTimeUpModal] = useState(false);
  const [guessedModal, setGuessedModal] = useState(false);
  const [nextPlayer, setNextPlayer] = useState("");
  const [correctGuesser, setCorrectGuesser] = useState("");
  const [activeEmojis, setActiveEmojis] = useState<Record<string, string>>({});

  const chatRef = useRef<HTMLDivElement>(null);

  const [floatingEmoji, setFloatingEmoji] = useState<EmojiEffect | null>(null);

  const showEmojiEffect = (emoji: string, sender: string) => {
    setFloatingEmoji({ emoji, sender });
    setActiveEmojis((prev) => ({ ...prev, [sender]: emoji }));
    setTimeout(() => {
      setFloatingEmoji(null);
      setActiveEmojis((prev) => {
        const copy = { ...prev };
        delete copy[sender];
        return copy;
      });
    }, 2000);
  };
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

  useEffect(() => {
    socket.on("emoji", ({ emoji, sender }) => {
      showEmojiEffect(emoji, sender);
    });

    return () => {
      socket.off("emoji");
    };
  }, []);

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

  const sendEmoji = (emoji: string) => {
    socket.emit("emoji", { emoji, sender: socketId, roomId: gameState.roomId });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br  from-pink-100 via-yellow-50 to-blue-100 text-sm sm:text-base font-[Inter]">
      {/* 🎮 Top Bar */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-2 bg-white/90 backdrop-blur border-b border-gray-300 shadow-sm">
        <div className="font-bold text-purple-700 tracking-tight">
          🎯 Round{" "}
          <span className="text-purple-900">{gameState.round || 1}</span>
        </div>

        {floatingEmoji && (
          <div className="fixed top-[50%] left-[50%] z-40 text-5xl animate-bounce pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
            {floatingEmoji?.emoji}
          </div>
        )}

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
              {gameState?.word?.split(" ").map((word, wordIdx) => (
                <span key={wordIdx} className="mr-4">
                  {word
                    .split("")
                    .map((char, idx) =>
                      /[a-zA-Z]/.test(char) ? (
                        <span key={idx}>_ </span>
                      ) : (
                        <span key={idx}>{char} </span>
                      )
                    )}
                </span>
              ))}
            </span>
          </>
        )}
      </div>

      <div className="px-4 py-1 overflow-x-auto overflow-y-hidden relative border-y border-purple-100 bg-white/70 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          {gameState.players?.map((player) => (
            <div key={player.id} className="relative flex-shrink-0">
              {activeEmojis[player.id] && (
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 text-xl animate-bounce z-50 pointer-events-none">
                  {activeEmojis[player.id]}
                </div>
              )}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm shadow-md whitespace-nowrap font-medium transition-all ${
                  player.id === currentScribbler?.id
                    ? "bg-purple-100 text-purple-900 border border-purple-300"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="flex-shrink-0">
                  <Avatar avatarSrc={player.avatar} size="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <span>{player.name}</span>
                  {player.id === currentScribbler?.id && "✏️"}
                </div>
                <span className="ml-2 text-[10px] bg-yellow-200 text-yellow-800 px-2 py-[1px] rounded-full font-semibold">
                  {player.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center px-2 py- sm:p-4">
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
          {/* 📨 Chat — kept exactly as you have it */}
          <div className="flex-1  flex flex-col min-h-0">
            <div className="flex gap-2 p-1 px-2 bg-white/80 backdrop-blur border-b overflow-x-auto">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="text-xl hover:scale-110 transition"
                  onClick={() => sendEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* <h3 className="text-md font-semibold text-blue-600 mb-2">Chat</h3> */}
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
