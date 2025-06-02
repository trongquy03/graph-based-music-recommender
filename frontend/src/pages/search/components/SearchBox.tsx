"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchStore } from "@/stores/useSearchStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuth } from "@clerk/clerk-react";
import LikeButton from "@/pages/home/components/LikeButton";
import { Search, Play, Pause, X } from "lucide-react";
import ReactDOM from "react-dom";

export const SearchBox = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, search, results, clear } = useSearchStore();
  const { setCurrentSong, currentSong, isPlaying } = usePlayerStore();
  const { isSignedIn } = useAuth();

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return clear();
      updateDropdownPosition();
      search(trimmed);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        clear();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition);
    const interval = setInterval(updateDropdownPosition, 300);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition);
      clearInterval(interval);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      clear();
    }
  };

  const dropdown =
    (results.songs.length > 0 || results.artists?.length > 0) &&
    ReactDOM.createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: "absolute",
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 9999,
        }}
        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl p-3 space-y-4"
      >
        {results.songs.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-2">🎵 Gợi ý bài hát</p>
            <div className="space-y-1">
              {results.songs.slice(0, 4).map((song) => {
                const isCurrent = currentSong?._id === song._id;
                return (
                  <div
                    key={song._id}
                    className={`group flex items-center gap-3 p-2 rounded cursor-pointer transition ${
                      isCurrent ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                    onClick={() => setCurrentSong(song)}
                  >
                    <div className="relative">
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />
                        ) : (
                          <Play className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-white font-semibold truncate">{song.title}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {typeof song.artist === "object" ? song.artist.name : song.artist}
                      </p>
                    </div>
                    {isSignedIn && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition"
                      >
                        <LikeButton song={song} className="scale-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {results.artists?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-2">🎤 Nghệ sĩ</p>
            <div className="space-y-1">
              {results.artists.slice(0, 2).map((artist) => (
                <div
                  key={artist._id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                  onClick={() => {
                    navigate(`/artists/${artist._id}`);
                    clear();
                  }}
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-10 h-10 object-cover rounded-full"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white font-semibold truncate">{artist.name}</p>
                    <p className="text-xs text-zinc-500 truncate">Nghệ sĩ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>,
      document.body
    );

  return (
    <>
      <div
        ref={containerRef}
        className="relative hidden sm:flex w-full max-w-md items-center"
      >
        <Search className="absolute left-3 size-4 text-zinc-500 dark:text-zinc-400" />

        <input
          ref={inputRef}
          placeholder="Tìm bài hát, nghệ sĩ..."
          className="w-full pl-10 pr-8 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {query.length > 0 && (
          <button
            onClick={clear}
            className="absolute right-2 text-zinc-400 cursor-pointer transition"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {dropdown}
    </>
  );
};

export default SearchBox;
