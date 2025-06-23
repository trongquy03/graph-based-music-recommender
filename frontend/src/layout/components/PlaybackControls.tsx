import RatingSelector from "@/components/RatingSelector";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import LikeButton from "@/pages/home/components/LikeButton";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRatingStore } from "@/stores/useRatingStore";
import { useAuth } from "@clerk/clerk-react";
import KaraokePanel from "@/components/KaraokePanel";
import CommentPanel from "@/pages/comment/CommentPanel";
import { ytPlayerRef } from "@/lib/youtubePlayer";
import clsx from "clsx";
import {
  MessageSquare,
  Mic2,
  Pause,
  Play,
  PlaySquare,
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

const extractYoutubeId = (url: string) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|watch)\??v?=?|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : "";
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
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [showYoutube, setShowYoutube] = useState(false);
  const [youtubeExpanded, setYoutubeExpanded] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { likeCounts, fetchLikeCountBySongId } = useMusicStore();
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
    if (typeof window.YT === "undefined") {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    if (!currentSong || currentSong.audioUrl || !currentSong.youtubeUrl) return;

    const ytDiv = document.getElementById("hidden-youtube");
    if (!ytDiv) return;

    const player = new window.YT.Player("hidden-youtube", {
    videoId: extractYoutubeId(currentSong.youtubeUrl),
    events: {
/**
 * Initializes the YouTube player when the API is ready and starts video playback.
 *
 * @param event - The event object containing the player target.
 */

      onReady: (event: any) => {
        setYtPlayer(event.target);
        ytPlayerRef.current = event.target;
        if (isPlaying) {
          event.target.playVideo(); 
        }
      },

      onStateChange: (event: any) => {
        // 0 = ended
        if (event.data === window.YT.PlayerState.ENDED) {
          if (isLooping) {
            event.target.seekTo(0);
            event.target.playVideo();
          } else {
            playNext(); 
          }
        }
      },
    },
    playerVars: {
      autoplay: 0,
      controls: 0,
    },
  });


    return () => {
      player?.destroy?.();
    };
  }, [currentSong]);

  useEffect(() => {
  setShowYoutube(false);
}, [currentSong]);


  useEffect(() => {
  const interval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
      setCurrentTime(ytPlayer.getCurrentTime());
      setDuration(ytPlayer.getDuration());
    }
  }, 500); // cập nhật mỗi nửa giây

  return () => clearInterval(interval);
}, [ytPlayer]);


useEffect(() => {
  if (!currentSong?.audioUrl) return;
  const audio = audioRef.current;
  if (!audio) return;

  const updateTime = () => setCurrentTime(audio.currentTime);
  const updateDuration = () => setDuration(audio.duration);
  const handleEnded = () => {
    if (isLooping) {
      audio.currentTime = 0;
      audio.play();
    } else {
      playNext();
    }
  };

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", updateDuration);
  audio.addEventListener("ended", handleEnded);

  return () => {
    audio.removeEventListener("timeupdate", updateTime);
    audio.removeEventListener("loadedmetadata", updateDuration);
    audio.removeEventListener("ended", handleEnded);
  };
}, [currentSong, isLooping, playNext]);


  const handleSeek = (value: number[]) => {
  if (currentSong?.audioUrl && audioRef.current) {
    audioRef.current.currentTime = value[0];
  } else if (ytPlayer && ytPlayer.seekTo) {
    ytPlayer.seekTo(value[0], true);
  }
};


  const toggleMute = () => {
  if (volume === 0) {
    setVolume(prevVolume);
    if (audioRef.current) {
    audioRef.current.volume = prevVolume / 100;
  }

    ytPlayer?.setVolume?.(prevVolume);
  } else {
    setPrevVolume(volume);
    setVolume(0);
    if (audioRef.current) {
    audioRef.current.volume = prevVolume / 100;
  }

    ytPlayer?.setVolume?.(0);
  }
};


  const userRating = currentSong ? getUserRatingForSong(currentSong._id) : null;
  const avgRating = currentSong ? getAverageRatingForSong(currentSong._id) : { average: 0, totalRatings: 0 };
  return (
    <div className="relative">
      {showLyrics && currentSong?.lyricsUrl && (
        <div className="fixed top-0 left-0 right-0 bottom-20 z-50 bg-black/95 flex flex-col">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <KaraokePanel audioRef={audioRef} lyricsUrl={currentSong.lyricsUrl} currentSong={currentSong} />
          </div>
        </div>
      )}

    <footer className="h-20 sm:h-24 bg-zinc-900 border-t border-zinc-800 px-4">
      <div className="flex justify-between items-center h-full max-w-[1800px] mx-auto">
        <div className="hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]">
  {currentSong && typeof currentSong.artist === "object" && currentSong.artist !== null ? (
    <>
      {/* Ảnh - click được */}
      <img
        src={currentSong.imageUrl}
        alt={currentSong.title}
        onClick={() => navigate(`/artists/${currentSong.artist._id}`)}
        className="w-14 h-14 object-cover rounded-md cursor-pointer hover:opacity-80 transition"
      />

      <div className="flex-1 min-w-0"> 
          <div className="font-medium truncate text-white cursor-pointer flex items-center gap-1"  onClick={() => navigate(`/music/${currentSong._id}`)}>
            {currentSong.title}
            {currentSong.isPremium && (
              <span className="bg-yellow-500 text-black text-[10px] font-semibold px-2 py-0.5 rounded"> PREMIUM</span>
            )}
        </div>
        <div
          className="text-sm text-zinc-400 truncate hover:underline cursor-pointer "
          onClick={() => navigate(`/artists/${currentSong.artist._id}`)}
        >
          {currentSong.artist.name}
        </div>
      </div>
    </>
  ) : (
    // Trường hợp không có object artist
    <>
      <img
        src={currentSong?.imageUrl}
        alt={currentSong?.title}
        className="w-14 h-14 object-cover rounded-md"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-white">{currentSong?.title}</div>
        <div className="text-sm text-zinc-400 truncate">{typeof currentSong?.artist === "object" && currentSong.artist
              ? currentSong.artist.name
             : currentSong?.artist}</div>
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
  onClick={() => {
    const store = usePlayerStore.getState();

    if (currentSong?.audioUrl) {
      const audio = audioRef.current;
      if (audio) {
        isPlaying ? audio.pause() : audio.play();
      }
    } else if (ytPlayer) {
      isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
    }

    store.setIsPlaying(!isPlaying);
  }}
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



            <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowLyrics(!showLyrics)}
            className={clsx(
              "cursor-pointer transition-colors",
              showLyrics ? "text-emerald-400" : "text-zinc-400 hover:text-white"
            )}
          >
            <Mic2 className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (currentSong?.youtubeUrl) {
                setShowYoutube(true);
                setYoutubeExpanded(false); // mặc định hiển thị nhỏ
                audioRef.current?.pause();
                ytPlayer?.pauseVideo?.(); 

              } else {
                alert("Không có MV YouTube cho bài hát này.");
              }
            }}
          >
            <PlaySquare className="h-4 w-4" />
          </Button>


          {/* <Button size="icon" variant="ghost" className="hover:text-white cursor-pointer text-zinc-400">
            <ListMusic className="h-4 w-4" />
          </Button> */}

          {/* <Button size="icon" variant="ghost" className="hover:text-white cursor-pointer text-zinc-400">
            <Laptop2 className="h-4 w-4" />
          </Button> */}

      <Button
          size="icon"
          variant="ghost"
          onClick={() => document.dispatchEvent(new Event("toggle-comment-panel"))}
          className={clsx(
            "cursor-pointer transition-colors rounded-md", // bo góc để thấy nền
            commentOpen
              ? "bg-white/10 text-emerald-400" // nền mờ + chữ nổi
              : "text-zinc-400 hover:text-white hover:bg-white/5" // nền nhẹ khi hover
          )}
        >
          <MessageSquare className="h-4 w-4" />
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
                if (ytPlayer && ytPlayer.setVolume) {
                  ytPlayer.setVolume(value[0]); // yt volume là 0-100
                }
              }}

            />
          </div>
        </div>
      </div>
    </footer>

    <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
  <div id="hidden-youtube" />
</div>

    {showComments && currentSong && (
      <CommentPanel /> 
    )}

    {showYoutube && currentSong?.youtubeUrl && (
      <div className="fixed right-6 bottom-28 w-[420px] h-[240px] z-[9999] bg-black/90 rounded-lg shadow-xl flex flex-col justify-between overflow-hidden">
        <div className="relative w-full h-full">
          <iframe
            src={`https://www.youtube.com/embed/${extractYoutubeId(currentSong.youtubeUrl)}?autoplay=1&rel=0`}
            className="w-full h-full"
            title="YouTube MV"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>

          {/* Nút đóng */}
          <button
            onClick={() => setShowYoutube(false)}
            className="absolute top-2 right-2 bg-white text-black rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Nút next MV */}
        <div className="flex justify-between items-center px-4 py-2 bg-zinc-900">
          <div className="text-white text-xs truncate w-[85%]">
            🎬 {currentSong.title} – {typeof currentSong.artist === "object" ? currentSong.artist.name : currentSong.artist}
          </div>
          <button
            className="text-white text-xs px-2 py-1 bg-zinc-700 rounded hover:bg-zinc-600"
            onClick={playNext} // dùng từ `usePlayerStore`
          >
            Next ▶
          </button>
        </div>
      </div>
    )}

</div>
  );
};


export default PlaybackControls;
