"use client";
import { Mic } from "lucide-react";

export const VoiceListeningBox = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-screen bg-black/40 z-[9999] flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-[320px] max-w-[90%] p-6 relative text-center animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-zinc-500 hover:text-red-500 text-xl"
        >
          ×
        </button>
        <p className="text-lg font-semibold text-zinc-800 dark:text-white mb-6">Đang nghe...</p>
        <div className="flex justify-center">
          <div className="bg-red-500 p-5 rounded-full shadow-md animate-pulse">
            <Mic className="text-white w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
