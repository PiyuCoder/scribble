import React from "react";

type CreateOrJoinType = {
  onClick: (name: string, roomId?: string) => void;
  buttonText: string;
  closeModal: () => void;
};
const CreateOrJoinModal: React.FC<CreateOrJoinType> = ({
  onClick,
  buttonText,
  closeModal,
}) => {
  const inputRef1 = React.useRef<HTMLInputElement>(null);
  const inputRef2 = React.useRef<HTMLInputElement>(null);

  const isCreatingRoom = buttonText === "Create";

  const handleClick = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = isCreatingRoom ? undefined : inputRef1.current?.value.trim();
    const name = inputRef2.current?.value.trim() || "";

    console.log(isCreatingRoom, roomId, name);

    if (name) {
      isCreatingRoom ? onClick(name) : onClick(name, roomId);
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
