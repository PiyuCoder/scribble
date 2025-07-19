import React from "react";

type Props = {
  guesserName: string;
  nextPlayerName: string;
  word: string;
};

const CorrectGuessModal: React.FC<Props> = ({
  guesserName,
  nextPlayerName,
  word,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full">
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          🎉 Correct Guess!
        </h2>
        <p className="text-gray-800 text-lg mb-2">
          <span className="font-semibold">{guesserName}</span> guessed the word
          correctly!
        </p>
        <p className="text-gray-600 mb-4 font-bold">
          The word was: <span className="font-bold text-blue-600">{word}</span>
        </p>
        <p className="text-gray-600">
          Next turn: <strong>{nextPlayerName}</strong>
        </p>
      </div>
    </div>
  );
};

export default CorrectGuessModal;
