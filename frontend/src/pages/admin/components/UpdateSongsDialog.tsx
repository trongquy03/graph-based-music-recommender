import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { useArtistStore } from "@/stores/useArtistStore";
import { Song } from "@/types";
import SearchableSelectDialog from "./SearchableSelect";
import { GenreEnum, MoodEnum } from "@/lib/music";

interface Props {
  song: Song;
}

const UpdateSongDialog = ({ song }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { albums, fetchSongs } = useMusicStore();
  const { artists } = useArtistStore();

  const [updatedSong, setUpdatedSong] = useState({
    title: song.title,
    artist: typeof song.artist === "object" ? song.artist._id : song.artist,
    album: song.albumId ?? "",
    duration: String(song.duration ?? 0),
    genre: (song.genre as GenreEnum) ?? GenreEnum.None,
    mood: (song.mood as MoodEnum) ?? MoodEnum.None,
  });

  const [files, setFiles] = useState<{ audio: File | null; image: File | null }>({
    audio: null,
    image: null,
  });

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const formData = new FormData();
    formData.append("title", updatedSong.title);
    formData.append("artistId", updatedSong.artist);
    formData.append("duration", updatedSong.duration);

    if (updatedSong.genre !== GenreEnum.None) {
      formData.append("genre", updatedSong.genre);
    }

    if (updatedSong.mood !== MoodEnum.None) {
      formData.append("mood", updatedSong.mood);
    }

    if (updatedSong.album && updatedSong.album !== "none") {
      formData.append("albumId", updatedSong.album);
    }

    if (files.audio) formData.append("audioFile", files.audio);
    if (files.image) formData.append("imageFile", files.image);

    await axiosInstance.put(`/admin/songs/${song._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Song updated successfully");
    fetchSongs();
    setDialogOpen(false);
  } catch (err: any) {
    toast.error("Failed to update song: " + err.message);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Update Song</DialogTitle>
          <DialogDescription>Change song details, artist, album or audio/image</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            accept="audio/*"
            ref={audioInputRef}
            hidden
            onChange={(e) => setFiles((prev) => ({ ...prev, audio: e.target.files?.[0] || null }))}
          />

          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            hidden
            onChange={(e) => setFiles((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={updatedSong.title}
              onChange={(e) => setUpdatedSong({ ...updatedSong, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Artist</label>
            <SearchableSelectDialog
              value={updatedSong.artist}
              onChange={(val) => setUpdatedSong({ ...updatedSong, artist: val })}
              options={artists.map((a) => ({ label: a.name, value: a._id }))}
              placeholder="Select artist"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Genre</label>
            <select
              value={updatedSong.genre}
              onChange={(e) =>
                setUpdatedSong({ ...updatedSong, genre: e.target.value as GenreEnum })
              }
              className="bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm w-full"
            >
              <option value="none" disabled>Select genre...</option>
              {Object.values(GenreEnum)
                .filter((g) => g !== GenreEnum.None)
                .map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mood</label>
            <select
              value={updatedSong.mood}
              onChange={(e) =>
                setUpdatedSong({ ...updatedSong, mood: e.target.value as MoodEnum })
              }
              className="bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm w-full"
            >
              <option value="none">No mood</option>
              {Object.values(MoodEnum)
                .filter((m) => m !== MoodEnum.None)
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Input
              type="number"
              min="0"
              value={updatedSong.duration}
              onChange={(e) => setUpdatedSong({ ...updatedSong, duration: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Album (Optional)</label>
            <SearchableSelectDialog
              value={updatedSong.album}
              onChange={(val) => setUpdatedSong({ ...updatedSong, album: val })}
              options={[
                { label: "No Album (Single)", value: "none" },
                ...albums.map((a) => ({ label: a.title, value: a._id })),
              ]}
              placeholder="Select album"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
              {files.image ? files.image.name : "Change Image"}
            </Button>
            <Button variant="outline" onClick={() => audioInputRef.current?.click()}>
              {files.audio ? files.audio.name : "Change Audio"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSongDialog;
