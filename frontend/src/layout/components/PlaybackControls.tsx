import RatingSelector from "@/components/RatingSelector";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import LikeButton from "@/pages/home/components/LikeButton";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRatingStore } from "@/stores/useRatingStore";
import { useAuth } from "@clerk/clerk-react";
import clsx from "clsx";
import {
  Laptop2,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";



const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    shuffleQueue,
    toggleLoop,
    isLooping,
    isShuffling,
  } = usePlayerStore();
  const { isSignedIn } = useAuth();
  const { likeCounts, fetchLikeCountBySongId, likedSongIds } = useMusicStore();
  const {
    getUserRatingForSong,
    getAverageRatingForSong,
    rateSong,
  } = useRatingStore();

  const [volume, setVolume] = useState(75);
  const [prevVolume, setPrevVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showRatingSelector, setShowRatingSelector] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentSong) {
      fetchLikeCountBySongId(currentSong._id);
    }
  }, [currentSong]);

  useEffect(() => {
    audioRef.current = document.querySelector("audio");
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    const handleEnded = () => {
      if (isLooping && currentSong) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, isLooping, playNext]);

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
  };

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(prevVolume);
      if (audioRef.current) audioRef.current.volume = prevVolume / 100;
    } else {
      setPrevVolume(volume);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const userRating = currentSong ? getUserRatingForSong(currentSong._id) : null;
  const avgRating = currentSong ? getAverageRatingForSong(currentSong._id) : { average: 0, totalRatings: 0 };

  return (
    <footer className="h-20 sm:h-24 bg-zinc-900 border-t border-zinc-800 px-4">
      <div className="flex justify-between items-center h-full max-w-[1800px] mx-auto">
        <div className="hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]">
          {currentSong && (
            <>
              <img
                src={currentSong.imageUrl}
                alt={currentSong.title}
                className="w-14 h-14 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate hover:underline cursor-pointer">
                  {currentSong.title}
                </div>
                <div className="text-sm text-zinc-400 truncate hover:underline cursor-pointer">
                {typeof currentSong.artist === "object" && currentSong.artist !== null
                  ? currentSong.artist.name
                  : currentSong.artist}
              </div>
              </div>
              

            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]">
          <div className="flex items-center gap-4 sm:gap-6">
            <Button
            size="icon"
            variant="ghost"
            onClick={shuffleQueue}
            className={clsx(
              "hidden sm:inline-flex cursor-pointer",
              isShuffling
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Shuffle className="h-4 w-4" />
          </Button>

            <Button
              size="icon"
              variant="ghost"
              className="hover:text-white text-zinc-400 cursor-pointer"
              onClick={playPrevious}
              disabled={!currentSong}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="bg-white hover:bg-white/80 text-black cursor-pointer rounded-full h-8 w-8"
              onClick={togglePlay}
              disabled={!currentSong}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="hover:text-white cursor-pointer text-zinc-400"
              onClick={playNext}
              disabled={!currentSong}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant="ghost"
                onClick={toggleLoop}
                className={clsx(
                  "hidden sm:inline-flex cursor-pointer",
                  isLooping
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {isLooping ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </Button>
          </div>

          <div className="hidden sm:flex items-center gap-2 w-full">
            <div className="text-xs text-zinc-400">{formatTime(currentTime)}</div>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="w-full hover:cursor-grab active:cursor-grabbing"
              onValueChange={handleSeek}
            />
            <div className="text-xs text-zinc-400">{formatTime(duration)}</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end">
          {currentSong && isSignedIn && (
              <div className="flex items-center justify-center gap-3 relative">
                {/* Like */}
                <LikeButton song={currentSong} className="hover:scale-105 opacity-100 size-5" />
                <span className="text-sm text-zinc-400 leading-none">
                  {likeCounts[currentSong._id] ?? 0}
                </span>

                {/* Rating icon */}
                <div className="relative flex items-center gap-1">
                  <button
                    onClick={() => setShowRatingSelector((prev) => !prev)}
                    className="cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={clsx(
                        "h-5 w-5",
                        userRating ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"
                      )}
                    />
                  </button>
                  <span className="text-xs text-white/70">{avgRating.average.toFixed(1)}/5</span>

                  {showRatingSelector && (
                      <div className="absolute  bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 shadow-xl rounded-lg p-2">
                        <RatingSelector
                          current={userRating ?? 0}
                          onSelect={(val) => {
                            rateSong(currentSong._id, val);
                            setShowRatingSelector(false);
                          }}
                          onClear={() => {
                            rateSong(currentSong._id, 0);
                            setShowRatingSelector(false);
                            setTimeout(() => window.scrollBy(0, 1), 0);
                          }}
                        />
                      </div>
                    )}
                  </div>
              </div>
            )}



          <Button size="icon" variant="ghost" className="hover:text-white cursor-pointer text-zinc-400">
            <Mic2 className="h-4 w-4" />
          </Button>

          {/* <Button size="icon" variant="ghost" className="hover:text-white cursor-pointer text-zinc-400">
            <ListMusic className="h-4 w-4" />
          </Button> */}

          <Button size="icon" variant="ghost" className="hover:text-white cursor-pointer text-zinc-400">
            <Laptop2 className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="hover:text-white cursor-pointer text-zinc-400"
              onClick={toggleMute}
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-24 hover:cursor-grab active:cursor-grabbing"
              onValueChange={(value) => {
                setVolume(value[0]);
                if (audioRef.current) {
                  audioRef.current.volume = value[0] / 100;
                }
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlaybackControls;
