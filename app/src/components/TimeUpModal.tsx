import React from "react";

interface TimeUpModalProps {
  nextPlayerName: string;
}

const TimeUpModal: React.FC<TimeUpModalProps> = ({ nextPlayerName }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-80 text-center animate-fade-in-up">
        <h2 className="text-2xl font-semibold text-red-600">⏰ Time's Up!</h2>
        <p className="mt-2 text-gray-700 text-lg">
          Next turn:{" "}
          <span className="font-bold text-blue-600">{nextPlayerName}</span>
        </p>
      </div>
    </div>
  );
};

export default TimeUpModal;
