import { useEffect } from "react";
import { socket } from "../socket";
import { useGame, type Player } from "../context/GameContext";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../context/LoaderContext";

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
    showLoader();
    if (!gameState.roomId) return;
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br overscroll-none from-blue-100 via-yellow-50 to-purple-100 text-gray-800 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">
          Lobby: {gameState.roomId}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Waiting for players to join...
        </p>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-500">Players</h3>
          <ul className="space-y-2">
            {gameState?.players?.map((player) => (
              <li
                key={player.id}
                className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-full text-blue-700 font-medium shadow-sm"
              >
                {player.name}
                {player.isHost && (
                  <span className="ml-2 text-sm text-yellow-600 font-semibold">
                    (Host)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {gameState?.players?.length > 0 &&
          gameState?.players[0]?.id === socket?.id && (
            <button
              disabled={gameState?.players?.length < 2}
              onClick={enterGame}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 text-white font-bold rounded-full shadow-md transition-all duration-300 hover:scale-105"
            >
              🚀 Enter Game
            </button>
          )}
      </div>
    </div>
  );
};

export default Lobby;
