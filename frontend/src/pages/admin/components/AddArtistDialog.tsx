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
import { Upload, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { useArtistStore } from "@/stores/useArtistStore";
import { uploadToCloudinarySigned } from "@/lib/uploadToCloudinarySigned";

const AddArtistDialog = () => {
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [newArtist, setNewArtist] = useState({
    name: "",
    bio: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const { fetchArtists } = useArtistStore();

 const handleSubmit = async () => {
  setIsLoading(true);
  try {
    if (!imageFile) {
      toast.error("Please upload an image file");
      return;
    }

    const imageUrl = await uploadToCloudinarySigned(imageFile, "image");

    await axiosInstance.post("/admin/artists", {
      name: newArtist.name,
      bio: newArtist.bio,
      imageUrl,
    });

    toast.success("Artist added successfully");
    setNewArtist({ name: "", bio: "" });
    setImageFile(null);
    fetchArtists();
    setArtistDialogOpen(false);
  } catch (error: any) {
    toast.error("Failed to add artist: " + error.message);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <Dialog open={artistDialogOpen} onOpenChange={setArtistDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Artist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>Add New Artist</DialogTitle>
          <DialogDescription>Add a new artist to the system</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <div
            className="flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer"
            onClick={() => imageInputRef.current?.click()}
          >
            <div className="text-center">
              {imageFile ? (
                <div className="space-y-2">
                  <div className="text-sm text-emerald-500">Image selected:</div>
                  <div className="text-xs text-zinc-400">{imageFile.name.slice(0, 20)}</div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-800 rounded-full inline-block mb-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">Upload artist image</div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Artist Name</label>
            <Input
              value={newArtist.name}
              onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="Enter artist name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Input
              value={newArtist.bio}
              onChange={(e) => setNewArtist({ ...newArtist, bio: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
              placeholder="Enter short bio"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setArtistDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !newArtist.name}>
            {isLoading ? "Adding..." : "Add Artist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddArtistDialog;
