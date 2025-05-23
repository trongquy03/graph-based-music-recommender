import { useEffect } from "react";
import { useArtistStore } from "@/stores/useArtistStore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import UpdateArtistDialog from "./UpdateArtistDialog"; // ✅ Thêm dòng này

const ArtistsTable = () => {
  const { artists, fetchArtists, deleteArtist } = useArtistStore();

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-zinc-800/50">
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {artists.map((artist) => (
          <TableRow key={artist._id} className="hover:bg-zinc-800/50">
            <TableCell>
              {artist.imageUrl ? (
                <img src={artist.imageUrl} alt={artist.name} className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 bg-zinc-700 rounded" />
              )}
            </TableCell>
            <TableCell className="font-medium">{artist.name}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <UpdateArtistDialog artist={artist} /> {/* ✅ Gọi dialog sửa */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteArtist(artist._id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ArtistsTable;
