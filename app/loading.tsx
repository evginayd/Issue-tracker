import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="w-full h-1 bg-gray-200">
      <div
        className="h-full bg-black animate-pulse"
        style={{ width: "100%" }}
      ></div>
    </div>
  );
};

export default Loading;
