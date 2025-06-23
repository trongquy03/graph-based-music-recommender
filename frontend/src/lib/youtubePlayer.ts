// lib/youtubePlayer.ts

export const ytPlayerRef: {
  current: YT.Player | null;
  isReady: boolean;
  queue?: (() => void)[];
} = {
  current: null,
  isReady: false,
  queue: [],
};

type YoutubePlayerOptions = {
  onEnded: () => void;
};

/**
 * Initializes the hidden YouTube player.
 * Automatically loads YouTube Iframe API if needed.
 */
export const initializeYouTubePlayer = (options: YoutubePlayerOptions) => {
  if (typeof window === "undefined") return;

  // Nếu đã khởi tạo rồi thì không làm lại
  if (ytPlayerRef.isReady) return;

  const setupPlayer = () => {
    ytPlayerRef.current = new window.YT.Player("hidden-youtube", {
      height: "0",
      width: "0",
      videoId: "", // sẽ load sau
      playerVars: {
        autoplay: 0,
        controls: 0,
      },
      events: {
        onReady: () => {
          ytPlayerRef.isReady = true;
          ytPlayerRef.queue?.forEach((fn) => fn());
          ytPlayerRef.queue = [];
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            options.onEnded();
          }
        },
      },
    });
  };

  // Nếu API đã sẵn sàng
  if (window.YT && window.YT.Player) {
    setupPlayer();
  } else {
    // Tải script nếu chưa có
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      setupPlayer();
    };
  }
};

/**
 * Chờ đến khi player sẵn sàng để gọi hàm bất đồng bộ
 */
const execWhenReady = (fn: () => void) => {
  if (ytPlayerRef.isReady && ytPlayerRef.current) {
    fn();
  } else {
    ytPlayerRef.queue?.push(fn);
  }
};

/**
 * Load video mới vào player
 */
export const loadVideoById = (videoId: string) => {
  execWhenReady(() => {
    ytPlayerRef.current?.loadVideoById(videoId);
  });
};

/**
 * Play video
 */
export const playVideo = () => {
  execWhenReady(() => {
    ytPlayerRef.current?.playVideo();
  });
};

/**
 * Pause video
 */
export const pauseVideo = () => {
  execWhenReady(() => {
    ytPlayerRef.current?.pauseVideo();
  });
};

/**
 * Seek đến vị trí (giây)
 */
export const seekTo = (seconds: number) => {
  execWhenReady(() => {
    ytPlayerRef.current?.seekTo(seconds, true);
  });
};

/**
 * Set âm lượng (0-100)
 */
export const setVolume = (value: number) => {
  execWhenReady(() => {
    ytPlayerRef.current?.setVolume(value);
  });
};

/**
 * Get current time (giây)
 */
export const getCurrentTime = (): number => {
  if (ytPlayerRef.current?.getCurrentTime) {
    return ytPlayerRef.current.getCurrentTime();
  }
  return 0;
};

/**
 * Get duration (giây)
 */
export const getDuration = (): number => {
  if (ytPlayerRef.current?.getDuration) {
    return ytPlayerRef.current.getDuration();
  }
  return 0;
};
