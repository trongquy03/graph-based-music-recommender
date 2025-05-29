import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { Calendar, Trash2, Mic2 } from "lucide-react";
import UpdateSongsDialog from "./UpdateSongsDialog";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import LyricsOptionsDialog from "@/components/LyricsOptionsDialog";

const SongsTable = () => {
  const { songs, isLoading, error, deleteSong } = useMusicStore();

  const handleGenerateLyrics = async (song: any) => {
  if (song.lyricsUrl) {
    toast("Lyrics already exist", { icon: "✅" });
    return;
  }

  try {
    const res = await axiosInstance.post(`/admin/songs/${song._id}/generate-lyrics`);
    if (res.data?.lyricsUrl) {
      toast.success("Lyrics generated successfully");
    } else {
      toast("No lyrics returned", { icon: "⚠️" });
    }
  } catch (err: any) {
    toast.error("Failed to generate lyrics");
    console.error(err);
  }
};


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-zinc-400">Loading songs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-zinc-800/50">
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Release Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {songs.map((song) => (
          <TableRow key={song._id} className="hover:bg-zinc-800/50">
            <TableCell>
              <img
                src={song.imageUrl}
                alt={song.title}
                className="size-10 rounded object-cover"
              />
            </TableCell>
            <TableCell className="font-medium">{song.title}</TableCell>
            <TableCell>
              {typeof song.artist === "object" && song.artist !== null
                ? song.artist.name
                : song.artist}
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <Calendar className="h-4 w-4" />
                {song.createdAt.split("T")[0]}
              </span>
            </TableCell>

            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                {/* Nút Generate Lyrics */}
                <LyricsOptionsDialog songId={song._id} />


                {/* Nút Update */}
                <UpdateSongsDialog song={song} />

                {/* Nút Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => deleteSong(song._id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SongsTable;
