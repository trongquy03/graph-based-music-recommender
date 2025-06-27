"use client";

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "@/lib/axios";
import { Trash } from "lucide-react";
import CreatePlaylistButton from "./components/CreatePlaylistButton";
import { ScrollArea } from "@/components/ui/scroll-area";

const PlaylistPage = () => {
  const { playlists, fetchPlaylists } = usePlaylistStore();
  const { user } = useUser();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await axiosInstance.delete(`/playlists/${playlistId}`);
      await fetchPlaylists();
    } catch (err) {
      console.error("Không thể xoá playlist:", err);
    }
  };

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            
            {/* Tạo playlist mới */}
            <CreatePlaylistButton
              trigger={
                <div className="flex flex-col items-center justify-center border border-dashed border-white/30 rounded-md aspect-square hover:bg-white/5 transition cursor-pointer">
                  <div className="text-4xl">+</div>
                  <span className="text-sm mt-2">Tạo playlist mới</span>
                </div>
              }
            />

            {/* Danh sách playlist */}
            {playlists.map((playlist) => (
              <div key={playlist._id} className="relative group h-full">
                <Link to={`/playlists/${playlist._id}`}>
                  <div className="flex flex-col rounded-md overflow-hidden cursor-pointer hover:brightness-110 transition h-full">
                    <img
                      src={
                        playlist.songs[0]?.song?.imageUrl ||
                        "/tunewise_logo.png"
                      }
                      alt={playlist.name}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="py-2 px-1">
                      <p className="text-sm font-semibold truncate">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.fullName || "Ẩn danh"}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Nút xoá hiển thị khi hover */}
                <button
                  onClick={() => handleDeletePlaylist(playlist._id)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                            bg-black/60 hover:bg-red-600 text-white rounded-full p-2 opacity-0 
                            group-hover:opacity-100 transition z-10"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </main>
  );
};

export default PlaylistPage;
