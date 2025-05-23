import { useState, useRef, useEffect } from "react";
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
import { useArtistStore } from "@/stores/useArtistStore";
import SearchableSelectDialog from "./SearchableSelect"; // cập nhật nếu khác
import { Album } from "@/types";

interface Props {
  album: Album;
}

const UpdateAlbumsDialog = ({ album }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { artists, fetchArtists } = useArtistStore();

  const [updatedAlbum, setUpdatedAlbum] = useState({
    title: album.title,
    artist: typeof album.artist === "object" ? album.artist._id : album.artist,
    releaseYear: album.releaseYear,
  });

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", updatedAlbum.title);
      formData.append("artist", updatedAlbum.artist);
      formData.append("releaseYear", String(updatedAlbum.releaseYear));
      if (imageFile) formData.append("imageFile", imageFile);

      await axiosInstance.put(`/admin/albums/${album._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Album updated successfully");
      setDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to update album: " + error.message);
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
          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Update Album</DialogTitle>
          <DialogDescription>Change album details or image</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            hidden
            onChange={(e) =>
              setImageFile(e.target.files?.[0] ?? null)
            }
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Album Title</label>
            <Input
              value={updatedAlbum.title}
              onChange={(e) => setUpdatedAlbum({ ...updatedAlbum, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Artist</label>
            <SearchableSelectDialog
              value={updatedAlbum.artist}
              onChange={(val) => setUpdatedAlbum({ ...updatedAlbum, artist: val })}
              options={artists.map((artist) => ({
                label: artist.name,
                value: artist._id,
              }))}
              placeholder="Select artist"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Release Year</label>
            <Input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={updatedAlbum.releaseYear}
              onChange={(e) =>
                setUpdatedAlbum({
                  ...updatedAlbum,
                  releaseYear: parseInt(e.target.value),
                })
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              {imageFile ? imageFile.name : "Change Album Image"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAlbumsDialog;
