import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types"
import { Pause, Play } from "lucide-react";

const PlayButton = ({song}: {song: Song}) => {
  const {currentSong, isPlaying, setCurrentSong, togglePlay} = usePlayerStore();
  const isCurrentSong = song._id === currentSong?._id;

  const hanldePlay = () => {
      if (isCurrentSong) togglePlay();
      else setCurrentSong(song);
  }
  return (
    <Button 
        size={"icon"}
        onClick={hanldePlay}
        className={`absolute bottom-3 right-2 bg-green-500 hover:bg-green-400 hover:scale-105 transition-all 
            opacity-0 translate-y-2 cursor-pointer group-hover:translate-y-0 ${
                isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
    >
        {isCurrentSong && isPlaying ? (
				<Pause className='size-5 text-black' />
			) : (
				<Play className='size-5 text-black' />
			)}
    </Button>
  )
}

export default PlayButton