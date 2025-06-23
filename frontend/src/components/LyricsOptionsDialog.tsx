import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic2, Upload } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { toast } from "react-hot-toast";

interface Props {
  songId: string;
  initialLyricsUrl?: string; 
}

const LyricsOptionsDialog = ({ songId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lyricsText, setLyricsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Luôn fetch lyrics khi mở Dialog
  useEffect(() => {
    if (!isOpen) return;
    const fetchLyrics = async () => {
      try {
        const songRes = await axiosInstance.get(`/admin/songs/${songId}`);
        const url = songRes.data?.lyricsUrl;
        if (url) {
          const res = await fetch(url);
          const text = await res.text();
          setLyricsText(text);
        } else {
          setLyricsText(""); // Nếu không có lyrics
        }
      } catch (err) {
        console.warn("Không thể tải lyrics hiện có", err);
      }
    };
    fetchLyrics();
  }, [isOpen, songId]);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/admin/songs/${songId}/generate-lyrics`);
      toast.success("Lyrics generated via OpenAI");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate lyrics");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualUpload = async () => {
    if (lyricsText.trim().length < 10) return toast.error("Lyrics too short");

    setIsSubmitting(true);
    try {
      await axiosInstance.put(`/admin/songs/${songId}/lyrics/manual`, {
        lyricsText,
      });
      toast.success("Lyrics uploaded manually");
      // Không đóng dialog nữa để user thấy rõ nội dung đã nhập
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload lyrics");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".srt")) {
      toast.error("Vui lòng chọn file .srt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setLyricsText(text);
      toast.success("Đã nhập nội dung từ file .srt");
    };
    reader.readAsText(file);
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

          <div className="flex items-center justify-between gap-2">
            <span className="text-white">Import .srt file (nếu có):</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs flex items-center gap-1"
            >
              <Upload className="h-4 w-4 text-white" />
            </Button>
            <input
              type="file"
              accept=".srt"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <textarea
            placeholder="Dán hoặc chỉnh sửa nội dung .srt tại đây"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            className="w-full min-h-[140px] border border-zinc-300 rounded px-2 py-1 text-sm bg-zinc-50"
          />

          <Button
            variant="secondary"
            onClick={handleManualUpload}
            className="w-full"
            disabled={isSubmitting || lyricsText.trim().length < 10}
          >
            📥 Lưu lời bài hát
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LyricsOptionsDialog;
