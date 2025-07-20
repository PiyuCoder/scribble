import React from "react";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";
import avatar6 from "../assets/avatars/avatar6.png";

type CreateOrJoinType = {
  onClick: (name: string, roomId?: string, selectedAvatar?: string) => void;
  buttonText: string;
  closeModal: () => void;
};

const avatarList = [
  { id: "avatar1", src: avatar1 },
  { id: "avatar2", src: avatar2 },
  { id: "avatar3", src: avatar3 },
  { id: "avatar4", src: avatar4 },
  { id: "avatar5", src: avatar5 },
  { id: "avatar6", src: avatar6 },
];

const CreateOrJoinModal: React.FC<CreateOrJoinType> = ({
  onClick,
  buttonText,
  closeModal,
}) => {
  const inputRef1 = React.useRef<HTMLInputElement>(null);
  const inputRef2 = React.useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = React.useState<string>(
    avatarList[0].id
  );

  const isCreatingRoom = buttonText === "Create";

  const handleClick = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = isCreatingRoom ? undefined : inputRef1.current?.value.trim();
    const name = inputRef2.current?.value.trim() || "";

    console.log(isCreatingRoom, roomId, name);

    if (name) {
      isCreatingRoom
        ? onClick(name, selectedAvatar)
        : onClick(name, roomId, selectedAvatar);
      closeModal();
    } else {
      alert("Please enter a valid name.");
    }
  };
  return (
    <form
      onSubmit={handleClick}
      className=" fixed inset-0 h-full w-full bg-black bg-opacity-50 flex flex-col items-center gap-6 justify-center"
    >
      <p
        className=" absolute bottom-4 right-2 text-secondary"
        onClick={closeModal}
      >
        Back
      </p>
      {!isCreatingRoom && (
        <input
          required
          type="text"
          ref={inputRef1}
          placeholder="Enter Room ID"
          className="w-[60%] p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary"
        />
      )}

      <div className="flex overflow-auto ps-40 align-middle justify-center gap-3 w-[90%]  bg-white p-4 rounded-lg">
        {avatarList.map(({ id, src }) => (
          <img
            key={id}
            src={src}
            alt={id}
            onClick={() => setSelectedAvatar(id)}
            className={`w-14 h-14 rounded-full border-4 cursor-pointer transition ${
              selectedAvatar === id
                ? "border-blue-500 scale-110"
                : "border-transparent hover:scale-105"
            }`}
          />
        ))}
      </div>

      <input
        required
        type="text"
        ref={inputRef2}
        placeholder="Enter Name"
        className="w-[60%] p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-primary"
      />

      <button
        type="submit"
        className="ml-2 bg-primary text-white p-3 rounded-lg font-mono w-[60%]"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default CreateOrJoinModal;
