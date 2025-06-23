import { Playlist } from "../models/playlist.model.js";
import { Song } from "../models/song.model.js";

export async function createPlaylistFromPrompt(clerkUserId, prompt, songsData) {
  if (!clerkUserId || songsData.length === 0) return null;

  const title = `🎧 ${prompt.slice(0, 50)}...`;

  // Lấy song thực sự trong DB (có _id) dựa theo tiêu chí đã recommend
  const titles = songsData.map((s) => s.title);
  const songDocs = await Song.find({ title: { $in: titles } });

  if (!songDocs.length) return null;

  const playlist = await Playlist.create({
    title,
    user: clerkUserId, // là clerkId (string)
    songs: songDocs.map((s) => s._id),
    created_by_ai: true,
  });

  return {
    id: playlist._id,
    title: playlist.title,
    songCount: songDocs.length,
  };
}
