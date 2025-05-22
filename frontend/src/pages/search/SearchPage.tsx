"use client";

import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearchStore } from "@/stores/useSearchStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import LikeButton from "@/pages/home/components/LikeButton";
import { Play } from "lucide-react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";

const TABS = ["tat-ca", "bai-hat", "album"];

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const query = params.get("q") || "";
  const tab = params.get("tab") || "tat-ca";

  const { search, results } = useSearchStore();
  const { setCurrentSong, currentSong, isPlaying } = usePlayerStore();

  useEffect(() => {
    const delay = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length >= 1) {
        search(trimmed);
      }
    }, 100);

    return () => clearTimeout(delay);
  }, [query, tab]);


  const isCurrentSong = (id: string) => currentSong?._id === id;

  const handleTabChange = (tab: string) => {
    setParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", tab);
      return newParams;
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6 mt-4">
            Kết Quả Tìm Kiếm: <span className="text-indigo-500">{query}</span>
          </h1>

          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-zinc-700 text-sm font-medium">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`pb-2 ${
                  tab === t ? "border-b-2 border-indigo-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t === "tat-ca" ? "TẤT CẢ" : t === "bai-hat" ? "BÀI HÁT" : "ALBUM"}
              </button>
            ))}
          </div>

          {/* Bài hát */}
          {(tab === "tat-ca" || tab === "bai-hat") && results.songs.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">🎵 Bài Hát</h2>
                {tab === "tat-ca" && (
                  <button
                    onClick={() => handleTabChange("bai-hat")}
                    className="text-sm text-indigo-500 hover:underline"
                  >
                    Tất cả →
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(tab === "tat-ca" ? results.songs.slice(0, 6) : results.songs).map((song) => (
                  <div
                    key={song._id}
                    className={`group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition ${
                      isCurrentSong(song._id) ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                    onClick={() => setCurrentSong(song)}
                  >
                    <div className="relative">
                      <img src={song.imageUrl} alt={song.title} className="w-12 h-12 object-cover rounded" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate text-white">{song.title}</p>
                      <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
                    </div>
                    <p className="text-xs text-zinc-400 w-10 text-right">{formatDuration(song.duration)}</p>
                    <LikeButton song={song} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums */}
          {(tab === "tat-ca" || tab === "album") && results.albums.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">💿 Album</h2>
                {tab === "tat-ca" && (
                  <button
                    onClick={() => handleTabChange("album")}
                    className="text-sm text-indigo-500 hover:underline"
                  >
                    Tất cả →
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(tab === "tat-ca" ? results.albums.slice(0, 6) : results.albums).map((album) => (
                  <div
                    key={album._id}
                    className="p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                    onClick={() => navigate(`/album/${album._id}`)}
                  >
                    <img src={album.imageUrl} alt={album.title} className="w-full h-40 object-cover rounded mb-2" />
                    <p className="font-medium truncate text-white">{album.title}</p>
                    <p className="text-sm text-zinc-400 truncate">{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Không có kết quả */}
          {results.songs.length === 0 && results.albums.length === 0 && (
            <p className="text-zinc-500">Không tìm thấy kết quả nào.</p>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default SearchPage;