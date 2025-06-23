export interface Artist {
  _id: string;
  name: string;
  bio: string;
  imageUrl: string;
  followersCount?: number; 
  isFollowing?: boolean;
}

export interface Tag {
  name: string;
  type: "Genre" | "Mood" | "Country" | "Era" | "Unknown";
}

export interface Song {
    _id: string;
    title: string;
    artist: Artist;
    mood?: "happy" | "sad" | "chill" | "motivational";
    genre: "pop" | "rock" | "hiphop" | "ballad" | "edm" | "rnb" | "country" | "lofi" | "movie";
    albumId?: string | null;
    album?: {
      _id: string;
      title: string;
    };
    lyricsUrl?: string;
    karaokeUrl?: string;
    imageUrl: string;
    audioUrl: string;
    youtubeUrl: string;
    duration: number;
    isPremium: boolean;
    createdAt: string;
    updatedAt: string;
    avgRating: number;
    tags?: Tag[];
}

export interface Album {
    _id: string;
    title: string;
    artist: Artist;
    imageUrl: string;
    releaseYear: number;
    songs: Song[]
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	_id: string;
	clerkId: string;
	fullName: string;
	imageUrl: string;
}

export interface LyricLine {
  start: number;
  end: number;
  text: string;
}


export * from "./clerk"; 