import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { Calendar, Music, Trash2 } from "lucide-react";
import UpdateAlbumsDialog from "./UpdateAlbumsDialog";
import { Input } from "@/components/ui/input";
import { Album } from "@/types";

const AlbumsTable = () => {
  const {
    fetchAlbumsWithPagination,
    deleteAlbum,
  } = useMusicStore();

  const [albumData, setAlbumData] = useState<Album[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const { albums, totalPages } = await fetchAlbumsWithPagination(currentPage, limit, search);
      setAlbumData(albums);
      setTotalPages(totalPages);
    };
    fetchData();
  }, [currentPage, limit, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input
          placeholder="🔍 Tìm album hoặc nghệ sĩ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          className="bg-zinc-800 text-white px-2 py-1 rounded text-sm border border-zinc-600"
        >
          {[10, 20, 50].map((opt) => (
            <option key={opt} value={opt}>
              {opt} / trang
            </option>
          ))}
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]" />
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Release Year</TableHead>
            <TableHead>Songs</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albumData.map((album) => (
            <TableRow key={album._id} className="hover:bg-zinc-800/50">
              <TableCell>
                <img src={album.imageUrl} alt={album.title} className="w-10 h-10 rounded object-cover" />
              </TableCell>
              <TableCell className="font-medium">{album.title}</TableCell>
              <TableCell>
                {typeof album.artist === "object" && album.artist !== null ? album.artist.name : album.artist}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  {album.releaseYear}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <Music className="h-4 w-4" />
                  {album.songs?.length || 0} songs
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <UpdateAlbumsDialog album={album} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlbum(album._id)}
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
          Trang {currentPage} / {totalPages}
        </div>
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Trang trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlbumsTable;
