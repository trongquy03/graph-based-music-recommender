// Full updated PlaylistDetailPage with editable name functionality
"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, Pause, Play, Trash2, Pencil } from "lucide-react";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { Song, Album, Artist } from "@/types";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

function SortableItem({ id, index, children }: { id: string; index: number; children: (props: { listeners: any }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return <div ref={setNodeRef} style={style} {...attributes}>{children({ listeners })}</div>;
}

const PlaylistDetailPage = () => {
  const { playlistId } = useParams();
  const {
    fetchPlaylistById,
    currentPlaylist,
    setCurrentPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylist,
    updatePlaylist,
  } = usePlaylistStore();
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playAlbum,
  } = usePlayerStore();
  const { searchTemp } = useSearchStore();

  const [showSearch, setShowSearch] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const [localResults, setLocalResults] = useState<SearchResults>({ songs: [], albums: [], artists: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  useEffect(() => {
    if (!playlistId) return;
    (async () => {
      const data = await fetchPlaylistById(playlistId);
      if (data) {
        setCurrentPlaylist(data);
        setNewName(data.name);
      }
    })();
  }, [playlistId]);

  const handleRename = async () => {
    if (!playlistId || !newName.trim()) return;
    await updatePlaylist(playlistId, { name: newName });
    const updated = await fetchPlaylistById(playlistId);
    if (updated) setCurrentPlaylist(updated);
    setIsEditingName(false);
  };

  const handlePlayPlaylist = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return;
    const isCurrent = currentPlaylist.songs.some(entry => entry.song._id === currentSong?._id);
    if (isCurrent) togglePlay();
    else {
      const songs = currentPlaylist.songs.map(entry => entry.song);
      playAlbum(songs, 0);
    }
  };

  const handlePlaySong = (index: number) => {
    if (!currentPlaylist) return;
    const songs = currentPlaylist.songs.map(entry => entry.song);
    playAlbum(songs, index);
  };

  const handleLocalSearch = async (value: string) => {
    setLocalQuery(value);
    if (!value.trim()) {
      setLocalResults({ songs: [], albums: [], artists: [] });
      return;
    }
    setSearchLoading(true);
    const res = await searchTemp(value);
    setLocalResults(res);
    setSearchLoading(false);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id || !currentPlaylist) return;
    const oldIndex = currentPlaylist.songs.findIndex(s => s.song._id === active.id);
    const newIndex = currentPlaylist.songs.findIndex(s => s.song._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newSongs = arrayMove(currentPlaylist.songs, oldIndex, newIndex);
    const newSongIds = newSongs.map(entry => entry.song._id);
    await reorderPlaylist(currentPlaylist._id, newSongIds);
    const updated = await fetchPlaylistById(currentPlaylist._id);
    if (updated) setCurrentPlaylist(updated);
  };

  return (
    <div className="h-full rounded-md">
      <ScrollArea className="h-full rounded-md">
        <div className="relative min-h-full">
          <div className="relative z-10">
            <div className="flex items-end gap-6 px-6 pt-8">
              <img src={currentPlaylist?.songs[0]?.song.imageUrl || "/tunewise_logo.png"} className="w-52 h-52 shadow-xl object-cover" />
              <div className="flex flex-col gap-2">
                <p className="text-sm text-white/70">Playlist của bạn</p>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        className="text-4xl sm:text-5xl font-bold bg-transparent text-white border-b border-white/20 focus:outline-none"
                        autoFocus
                      />
                    </>
                  ) : (
                    <>
                      <h1 className="text-4xl sm:text-5xl font-bold text-white">{currentPlaylist?.name}</h1>
                      <Pencil className="text-white w-5 h-5 cursor-pointer" onClick={() => setIsEditingName(true)} />
                    </>
                  )}
                </div>
                <span className="text-sm text-white/60">
                  {currentPlaylist?.createdBy?.fullName || ""} • {currentPlaylist?.songs.length || 0} bài hát
                </span>
              </div>
            </div>

            <div className="px-6 py-6 flex items-center gap-6">
              <Button
                onClick={handlePlayPlaylist}
                size="icon"
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all"
              >
                {isPlaying && currentPlaylist?.songs.some(entry => entry.song._id === currentSong?._id) ? (
                  <Pause className="h-7 w-7 text-black" />
                ) : (
                  <Play className="h-7 w-7 text-black" />
                )}
              </Button>
              <Button size="icon" variant="ghost" className="text-white" onClick={() => setShowSearch(prev => !prev)}>+</Button>
            </div>

            {showSearch && (
              <div className="px-6 space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Tìm bài hát để thêm..."
                  value={localQuery}
                  onChange={(e) => handleLocalSearch(e.target.value)}
                  className="w-full p-2 bg-zinc-800 text-white rounded-md"
                />
                {searchLoading && <p className="text-white text-sm">Đang tìm kiếm...</p>}
                {!searchLoading && localResults.songs.map((song) => {
                  const alreadyAdded = currentPlaylist?.songs.some(entry => entry.song._id === song._id);
                  const isThisAdding = isAdding === song._id;

                  return (
                    <div key={song._id} className="flex items-center justify-between p-3 rounded hover:bg-zinc-800 transition">
                      <div className="flex items-center gap-4">
                        <img src={song.imageUrl} alt={song.title} className="w-12 h-12 object-cover rounded" />
                        <div>
                          <p className="text-white font-medium">{song.title}</p>
                          <div className="text-sm text-zinc-400 flex items-center gap-2">
                            {typeof song.artist === "object" && song.artist.imageUrl && (
                              <img src={song.artist.imageUrl} alt={song.artist.name} className="w-5 h-5 object-cover rounded-full" />
                            )}
                            <span>{typeof song.artist === "object" ? song.artist.name : song.artist}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={alreadyAdded || isThisAdding}
                        onClick={async () => {
                          if (!playlistId || alreadyAdded || isThisAdding) return;
                          setIsAdding(song._id);
                          await addSongToPlaylist(playlistId, song._id);
                          const updated = await fetchPlaylistById(playlistId);
                          if (updated) setCurrentPlaylist(updated);
                          setIsAdding(null);
                        }}
                      >
                        {alreadyAdded ? "Đã có" : isThisAdding ? "Đang thêm..." : "Thêm"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-black/20 backdrop-blur-sm">
              <div className="grid grid-cols-[16px_4fr_2fr_80px] gap-4 px-4 py-2 text-sm text-zinc-400 border-b border-white/5">
                <div>#</div>
                <div>Tiêu đề</div>
                <div>Ngày thêm</div>
                <div className="flex items-center justify-between"><Clock className="h-4 w-4" /></div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentPlaylist?.songs.map(s => s.song._id) || []} strategy={verticalListSortingStrategy}>
                  <div className="px-4 space-y-2 py-4">
                    {currentPlaylist?.songs.map((entry, index) => {
                      const song = entry.song;
                      const isCurrentSong = song._id === currentSong?._id;

                      return (
                        <SortableItem key={song._id} id={song._id} index={index}>
                          {({ listeners }) => (
                            <div
                              onClick={() => handlePlaySong(index)}
                              className="grid grid-cols-[16px_4fr_2fr_auto] gap-4 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 rounded-md group cursor-pointer"
                            >
                              <div className="flex items-center justify-center">
                                <div {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab">
                                  {isCurrentSong && isPlaying ? (
                                    <div className="size-4 text-green-500">♫</div>
                                  ) : (
                                    <span className="group-hover:hidden">{index + 1}</span>
                                  )}
                                </div>
                                {!isCurrentSong && <Play className="h-4 w-4 hidden group-hover:block" />}
                              </div>
                              <div className="flex items-center gap-3">
                                <img src={song.imageUrl} alt={song.title} className="size-10" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-white">{song.title}</div>
                                    {song.isPremium && (
                                      <span className="bg-yellow-500 text-black text-[10px] font-semibold px-2 py-0.5 rounded">PREMIUM</span>
                                    )}
                                  </div>
                                  <div className="text-zinc-400 text-xs">{typeof song.artist === "object" ? song.artist.name : song.artist}</div>
                                </div>
                              </div>
                              <div className="flex items-center">{entry.addedAt?.split("T")[0] || "-"}</div>
                              <div className="flex items-center justify-end gap-3 text-zinc-400 text-sm">
                                <span>{formatDuration(song.duration)}</span>
                                <button
                                  className="ml-3 text-red-500 hover:text-red-400 invisible group-hover:visible"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!playlistId) return;
                                    await removeSongFromPlaylist(playlistId, song._id);
                                    const updated = await fetchPlaylistById(playlistId);
                                    if (updated) setCurrentPlaylist(updated);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </SortableItem>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlaylistDetailPage;
