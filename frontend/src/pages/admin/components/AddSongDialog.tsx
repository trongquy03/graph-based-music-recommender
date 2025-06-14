import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
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
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { useArtistStore } from "@/stores/useArtistStore";
import { Plus, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SearchableSelectDialog from "./SearchableSelect";
import AudioFileInput from "./AudioFileInput";
import { uploadToCloudinarySigned } from "@/lib/uploadToCloudinarySigned";
import { GenreEnum, MoodEnum } from "@/lib/music";

interface NewSong {
  title: string;
  artist: string;
  album: string;
  duration: string;
  genre: GenreEnum;
  mood: MoodEnum;
}

const AddSongDialog = () => {
  const { isSignedIn } = useAuth();
  const { albums, fetchAlbums } = useMusicStore();
  const { artists, fetchArtists } = useArtistStore();

  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newSong, setNewSong] = useState<NewSong>({
    title: "",
    artist: "",
    album: "",
    duration: "0",
    genre: GenreEnum.None,
    mood: MoodEnum.None,
  });

  const [files, setFiles] = useState<{ audio: File | null; image: File | null }>({
    audio: null,
    image: null,
  });

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchArtists(1, 50, "", isSignedIn ?? false);
  }, [fetchArtists]);
  useEffect(() => {
  fetchAlbums();
}, []);


  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (!files.audio || !files.image) {
        toast.error("Please upload both audio and image files");
        return;
      }
      if (newSong.genre === GenreEnum.None) {
        toast.error("Please select a genre for the song");
        return;
      }


      const audioUrl = await uploadToCloudinarySigned(files.audio, "video");
      const imageUrl = await uploadToCloudinarySigned(files.image, "image");

      await axiosInstance.post("/admin/songs", {
          title: newSong.title,
          artistId: newSong.artist,
          albumId: newSong.album === "none" ? null : newSong.album,
          duration: newSong.duration,
          audioUrl,
          imageUrl,
          genre: newSong.genre, 
          mood: newSong.mood === MoodEnum.None ? undefined : newSong.mood,
        });


      toast.success("Song added successfully");
      setNewSong({
        title: "",
        artist: "",
        album: "",
        duration: "0",
        genre: GenreEnum.Pop,
        mood: MoodEnum.Chill,
      });
      setFiles({ audio: null, image: null });
      setSongDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to add song: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
          <Plus className="h-4 w-4" />
          Thêm Bài Hát
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add New Song</DialogTitle>
          <DialogDescription>Add a new song to your music library</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setFiles((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
          />

          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}
          >
            <div className="text-center">
              {files.image ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">Image selected:</div>
                  <div className="text-xs text-zinc-400">{files.image.name.slice(0, 20)}</div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">Upload artwork</div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Audio File</label>
            <AudioFileInput
              currentFile={files.audio}
              onChange={(file, duration) => {
                setFiles((prev) => ({ ...prev, audio: file }));
                setNewSong((prev) => ({ ...prev, duration: String(duration) }));
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={newSong.title}
              onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Artist</label>
            <SearchableSelectDialog
              value={newSong.artist}
              onChange={(val) => setNewSong({ ...newSong, artist: val })}
              options={artists.map((artist) => ({
                label: artist.name,
                value: artist._id,
              }))}
              placeholder="Select artist"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Genre</label>
            <select
              value={newSong.genre}
              onChange={(e) =>
                setNewSong((prev) => ({ ...prev, genre: e.target.value as GenreEnum }))
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
          value={newSong.mood}
          onChange={(e) =>
            setNewSong((prev) => ({ ...prev, mood: e.target.value as MoodEnum }))
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
              value={newSong.duration}
              disabled
              className="bg-zinc-800 border-zinc-700"
              placeholder="Auto-detected"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Album (Optional)</label>
            <SearchableSelectDialog
              value={newSong.album}
              onChange={(val) => setNewSong({ ...newSong, album: val })}
              options={[
                { label: "No Album (Single)", value: "none" },
                ...(Array.isArray(albums) ? albums : []).map((album) => ({
                  label: album.title,
                  value: album._id,
                })),
              ]}
              placeholder="Select album"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setSongDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Add Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongDialog;
