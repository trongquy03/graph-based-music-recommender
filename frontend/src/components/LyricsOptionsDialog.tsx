// components/LyricsOptionsDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic2 } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { toast } from "react-hot-toast";

interface Props {
  songId: string;
}

const LyricsOptionsDialog = ({ songId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lyricsText, setLyricsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.put(`/api/songs/${songId}/lyrics`);
      toast.success("Lyrics generated via OpenAI");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to generate lyrics");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualUpload = async () => {
    if (lyricsText.trim().length < 10) return toast.error("Lyrics too short");
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.put(`/api/songs/${songId}/lyrics/manual`, {
        lyricsText,
      });
      toast.success("Lyrics uploaded manually");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to upload lyrics");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Lyrics Options">
          <Mic2 className="size-4 text-emerald-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lyrics Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Button
            onClick={handleGenerate}
            className="w-full"
            disabled={isSubmitting}
          >
            🎤 Tạo từ OpenAI
          </Button>

          <textarea
            placeholder="Dán nội dung .srt tại đây"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            className="w-full min-h-[120px] border border-zinc-300 rounded px-2 py-1 text-sm bg-zinc-50"
          />

          <Button
            variant="secondary"
            onClick={handleManualUpload}
            className="w-full"
            disabled={isSubmitting || lyricsText.trim().length < 10}
          >
            📥 Upload lời bài hát thủ công
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LyricsOptionsDialog;
