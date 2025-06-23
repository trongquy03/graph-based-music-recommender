export {};

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}
