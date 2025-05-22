import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useSearchStore } from "@/stores/useSearchStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate } from "react-router-dom";

export const MobileSearch = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, search, results, clear } = useSearchStore();
  const { setCurrentSong } = usePlayerStore();

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim().length > 1) search(query);
      else clear();
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleClose = () => {
    setOpen(false);
    clear();
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      handleClose();
    }
  };

  return (
    <>
      {/* Mobile icon trigger */}
      <div className="flex sm:hidden">
        <Search className="size-5 cursor-pointer text-white" onClick={() => setOpen(true)} />
      </div>

      {/* Fullscreen search popup */}
      {open && (
        <div className="fixed inset-0 bg-zinc-900 z-50 p-4 text-white overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <input
              ref={inputRef}
              autoFocus
              placeholder="Tìm bài hát hoặc album..."
              className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <X className="ml-3 size-6 cursor-pointer" onClick={handleClose} />
          </div>

          {(results.songs.length > 0 || results.albums.length > 0) && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-1">🎵 Bài hát</p>
                {results.songs.map((song) => (
                  <div
                    key={song._id}
                    className="text-sm py-2 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800 px-2 rounded"
                    onClick={() => {
                      setCurrentSong(song);
                      handleClose();
                    }}
                  >
                    {song.title} – <span className="text-zinc-400">{song.artist}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-1">💿 Album</p>
                {results.albums.map((album) => (
                  <div
                    key={album._id}
                    className="text-sm py-2 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800 px-2 rounded"
                    onClick={() => {
                      navigate(`/album/${album._id}`);
                      handleClose();
                    }}
                  >
                    {album.title} – <span className="text-zinc-400">{album.artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
