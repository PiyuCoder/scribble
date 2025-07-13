import React from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";
import { generateRoomId } from "../helpers/room";
import CreateOrJoinModal from "../components/CreateOrJoinModal";
import { useLoader } from "../context/LoaderContext";
import { useGame, type Player } from "../context/GameContext";

type CreateRoomResponse = {
  success: boolean;
  roomId?: string;
  message?: string;
  data?: Player[];
};

function Home() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = React.useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = React.useState(false);
  const { setGameState } = useGame();
  const { showLoader, hideLoader } = useLoader();

  const createRoom = (name: string) => {
    showLoader();
    socket.connect();
    const roomId = generateRoomId();
    console.log("Creating room with ID:", roomId, name);
    socket.emit("createRoom", { roomId, name, isHost: true });
    socket.on("room-created", (response: CreateRoomResponse) => {
      if (response.success) {
        console.log("Room created successfully:", response.roomId);
        setGameState((prev) => ({
          ...prev,
          roomId: response.roomId!,
          players: response.data!,
          gameStatus: "waiting",
        }));
        navigate("/lobby");
      } else {
        console.error("Failed to create room:", response.message);
      }
    });
    hideLoader();
  };

  const joinRoom = (name: string, roomId?: string) => {
    showLoader();
    console.log("Joining room with ID:", roomId, name);
    socket.emit("joinRoom", { roomId, name, isHost: false });
    socket.on("player-joined", (response: CreateRoomResponse) => {
      if (response.success) {
        console.log("Joined room successfully:", response.roomId);
        setGameState((prev) => ({
          ...prev,
          roomId: response.roomId!,
          players: response.data!,
          gameStatus: "waiting",
        }));
        navigate("/lobby");
      } else {
        console.error("Failed to join room:", response.message);
      }
    });
    hideLoader();
  };

  const handleCreateOrJoinToggle = (type: string) => {
    setShowModal(!showModal);
    if (type === "create") {
      setIsCreatingRoom(true);
    } else {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className=" w-screen flex flex-col items-center justify-center h-screen gap-8 overscroll-none">
      <p className="font-mono text-[2rem] animate-bounce font-bold tracking-[20px] ps-[30px] text-center justify-center">
        SCRIBBLE
      </p>
      <button
        onClick={() => handleCreateOrJoinToggle("create")}
        className=" bg-primary w-[60%] text-white text-2xl font-bold font-mono p-5 rounded-xl shadow-lg"
      >
        Create Room
      </button>
      <button
        onClick={() => handleCreateOrJoinToggle("join")}
        className=" bg-primary w-[60%] text-white text-2xl font-bold font-mono p-5 rounded-xl shadow-lg"
      >
        Join Room
      </button>
      {showModal && (
        <CreateOrJoinModal
          onClick={isCreatingRoom ? createRoom : joinRoom}
          buttonText={isCreatingRoom ? "Create" : "Join"}
          closeModal={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default Home;
