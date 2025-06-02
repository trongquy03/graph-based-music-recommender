import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { Calendar, Trash2 } from "lucide-react";
import UpdateSongsDialog from "./UpdateSongsDialog";
import LyricsOptionsDialog from "@/components/LyricsOptionsDialog";

const SongsTable = () => {
  const {
    songs,
    fetchSongs,
    page,
    totalPages,
    deleteSong,
  } = useMusicStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSongs(currentPage, limit, { search });
  }, [currentPage, limit, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input
          placeholder="🔍 Tìm bài hát hoặc nghệ sĩ..."
          value={search}
          onChange={(e) => {
            setCurrentPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Nghệ sĩ</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
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
                  {song.createdAt?.split?.("T")[0] ?? "Không rõ"}

                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <LyricsOptionsDialog songId={song._id} />
                  <UpdateSongsDialog song={song} />
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

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-zinc-400">
          Trang {page} / {totalPages}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">Bài/trang:</span>
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
                {opt}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Trang trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SongsTable;
