import { useEffect, useState } from "react";
import { useArtistStore } from "@/stores/useArtistStore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import UpdateArtistDialog from "./UpdateArtistDialog";
import { Input } from "@/components/ui/input";
import { Artist } from "@/types";

const ArtistsTable = () => {
  const { fetchArtists, deleteArtist } = useArtistStore();

  const [artistData, setArtistData] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const { artists, totalPages } = await fetchArtists(page, limit, search);
      setArtistData(artists);
      setTotalPages(totalPages);
    };
    fetchData();
  }, [page, limit, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input
          placeholder="🔍 Tìm nghệ sĩ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
       
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]" />
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artistData.map((artist) => (
            <TableRow key={artist._id} className="hover:bg-zinc-800/50">
              <TableCell>
                {artist.imageUrl ? (
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-zinc-700 rounded" />
                )}
              </TableCell>
              <TableCell className="font-medium">{artist.name}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <UpdateArtistDialog artist={artist} />
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

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-zinc-400">
          Trang {page} / {totalPages}
        </div>
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </Button>
           <select
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1);
          }}
          className="bg-zinc-800 text-white px-2 py-1 rounded text-sm border border-zinc-600"
        >
          {[10, 20, 50].map((opt) => (
            <option key={opt} value={opt}>
              {opt} / trang
            </option>
          ))}
        </select>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArtistsTable;
