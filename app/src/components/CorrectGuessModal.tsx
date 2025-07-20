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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center animate-slideUp">
        {/* Confetti Icon */}
        <h2 className="text-3xl font-extrabold text-green-600 mb-3">
          🎉 Correct Guess!
        </h2>

        {/* Guesser Info */}
        <p className="text-gray-800 text-lg mb-2">
          <span className="font-bold text-purple-600">{guesserName}</span>{" "}
          guessed it right!
        </p>

        {/* Word Reveal */}
        <p className="text-base text-gray-700 mb-4">
          The word was: <span className="text-blue-600 font-bold">{word}</span>
        </p>

        {/* Next Player Info */}
        <p className="text-sm text-gray-600">
          ✏️ Next turn:{" "}
          <strong className="text-purple-700">{nextPlayerName}</strong>
        </p>
      </div>
    </div>
  );
};

export default CorrectGuessModal;
