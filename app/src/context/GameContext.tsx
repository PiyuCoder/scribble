import React, { createContext, useContext, useState } from "react";

export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
};

type GameState = {
  roomId: string;
  round: number;
  currentPlayer: Player | null;
  players: Player[];
  gameStatus: "waiting" | "playing" | "finished";
  word: string;
  timer?: number;
  turnIndex?: number;
};

type GameContextType = {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    roomId: "",
    currentPlayer: null,
    players: [],
    gameStatus: "waiting",
    round: 1,
    word: "",
  });

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
