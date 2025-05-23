import { useRef } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface AudioFileInputProps {
  onChange: (file: File, duration: number) => void;
  currentFile?: File | null;
}

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Math.floor(audio.duration));
    };

    audio.onerror = () => {
      reject("Failed to load audio metadata");
    };

    audio.src = URL.createObjectURL(file);
  });
};

const AudioFileInput = ({ onChange, currentFile }: AudioFileInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const duration = await getAudioDuration(file);
      onChange(file, duration);
    } catch (err) {
      toast.error("Failed to get audio duration");
    }
  };

  return (
    <>
      <input
        type="file"
        accept="audio/*"
        ref={inputRef}
        className="hidden"
        onChange={handleSelect}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        {currentFile ? currentFile.name.slice(0, 30) : "Choose Audio File"}
      </Button>
    </>
  );
};

export default AudioFileInput;
