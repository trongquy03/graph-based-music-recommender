import React, { createContext, useContext, useRef } from "react";

// Kiểu context cho phép null ở cả ref lẫn context
export const AudioRefContext = createContext<React.RefObject<HTMLAudioElement | null> | null>(null);

// Provider cung cấp ref cho toàn bộ cây component
export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <AudioRefContext.Provider value={audioRef}>
      {children}
    </AudioRefContext.Provider>
  );
};

// Custom hook dùng để lấy ref
export const useAudioRef = () => {
  const context = useContext(AudioRefContext);
  if (!context) {
    throw new Error("useAudioRef must be used inside <AudioProvider>");
  }
  return context;
};
