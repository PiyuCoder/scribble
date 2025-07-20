import { useEffect } from "react";
import { socket } from "../socket";
import { useGame, type Player } from "../context/GameContext";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../context/LoaderContext";
import Avatar from "../components/Avatar";

export type EnterGameResponse = {
  success: boolean;
  message?: string;
  round: number;
  turnIndex?: number;
  word?: string;
  scores?: { id: string; score: number }[];
};

type LobbyResponse = {
  success: boolean;
  roomId: string;
  players: Player[];
};

const Lobby = () => {
  const { showLoader, hideLoader, loading } = useLoader();
  const { gameState, setGameState } = useGame();
  const navigate = useNavigate();

  console.log(loading);

  useEffect(() => {
    if (!gameState.roomId) {
      navigate("/");
      return;
    }

    showLoader();
    // 👇 Emit joinLobby for everyone — even the creator
    socket.emit("joinLobby", { roomId: gameState.roomId });

    socket.on("lobbyJoined", (response: LobbyResponse) => {
      console.log("Received lobbyJoined", response);

      if (response.success) {
        setGameState((prev) => ({
          ...prev,
          roomId: response.roomId,
          players: response.players,
          gameStatus: "waiting",
        }));
        hideLoader();
      }
    });

    socket.on("playerJoined", (response: { data: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        players: response.data,
      }));
    });

    return () => {
      socket.off("lobbyJoined");
      socket.off("playerJoined");
    };
  }, [gameState.roomId]);

  const enterGame = () => {
    console.log(`Entering game for room: ${gameState.roomId}`);
    socket.emit("enterGame", { roomId: gameState.roomId });
  };

  useEffect(() => {
    const handleGameStarted = (response: EnterGameResponse) => {
      showLoader();
      if (response.success) {
        setGameState((prev) => ({
          ...prev,
          players: prev?.players?.map((player) => {
            const updatedScore =
              response?.scores?.find((p) => p.id === player.id)?.score ??
              player.score;
            return { ...player, score: updatedScore };
          }),
          gameStatus: "playing",
          round: 1,
          turnIndex: response?.turnIndex,
          word: response?.word || "",
        }));
        hideLoader();
        navigate("/game");
      } else {
        console.error("Failed to start game:", response.message);
      }
    };

    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("gameStarted", handleGameStarted);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-yellow-50 to-purple-100 text-gray-800 p-6">
      {/* Lobby Box */}
      <div className="relative bg-white/30 backdrop-blur-lg shadow-2xl border border-white/20 rounded-3xl px-8 py-10 w-full max-w-md text-center animate-fadeIn">
        {/* Glowing Outline */}
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-purple-300 animate-pulse pointer-events-none"></div>

        {/* Heading */}
        <h2 className="text-4xl font-extrabold text-purple-700 drop-shadow mb-3 tracking-wide">
          🎮 Room: {gameState.roomId}
        </h2>
        <p className="text-base text-gray-700 mb-6 italic">
          Waiting for friends to join the battlefield...
        </p>

        {/* Players List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">
            👥 Players
          </h3>
          <ul className="space-y-2 max-h-[200px] overflow-y-auto px-2">
            {gameState?.players?.map((player, i) => (
              <li
                key={player.id}
                className={`bg-gradient-to-r flex items-center justify-center gap-2 from-white to-blue-50 px-4 py-2 rounded-full text-blue-700 font-semibold shadow-md border border-blue-200 transition transform hover:scale-105 ${
                  i % 2 === 0 ? "animate-slideInLeft" : "animate-slideInRight"
                }`}
              >
                <Avatar avatarSrc={player.avatar} size="w-10 h-10" />
                {player.name}
                {player.isHost && (
                  <span className="ml-2 text-sm text-yellow-600 font-semibold">
                    👑 Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Start Button */}
        {gameState?.players?.length > 0 &&
          gameState?.players[0]?.id === socket?.id && (
            <button
              disabled={gameState?.players?.length < 2}
              onClick={enterGame}
              className="w-full py-3 px-6 text-white font-bold rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Start Game
            </button>
          )}
      </div>
    </div>
  );
};

export default Lobby;
