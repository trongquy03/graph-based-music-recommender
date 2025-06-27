import { Playlist } from "../models/playlist.model.js";

// Tạo playlist mới
export const createPlaylist = async (req, res) => {
  const { name, isPublic = true, songs = [] } = req.body;
  const owner = req.auth.userId;

  try {
    const formattedSongs = songs.map(songId => ({
      song: songId,
      addedAt: new Date()
    }));

    const newPlaylist = await Playlist.create({
      name,
      isPublic,
      owner,
      songs: formattedSongs
    });

    res.status(201).json(newPlaylist);
  } catch (err) {
    res.status(500).json({ error: "Không thể tạo playlist", details: err.message });
  }
};

// Lấy tất cả playlist của người dùng
export const getUserPlaylists = async (req, res) => {
  const owner = req.auth.userId;

  try {
    const playlists = await Playlist.find({ owner }).populate({
      path: "songs.song",
      populate: { path: "artist", select: "name imageUrl" }
    });
    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy playlist" });
  }
};

// Thêm bài hát vào playlist
export const addSongToPlaylist = async (req, res) => {
  const { playlistId, songId } = req.body;
  const userId = req.auth.userId;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });
    if (!playlist) return res.status(404).json({ error: "Playlist không tồn tại" });

    const exists = playlist.songs.some(entry => entry.song.toString() === songId);
    if (!exists) {
      playlist.songs.push({ song: songId, addedAt: new Date() });
      await playlist.save();
    }

    const updated = await Playlist.findById(playlistId).populate({
      path: "songs.song",
      populate: { path: "artist", select: "name imageUrl" }
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Không thể thêm bài hát vào playlist" });
  }
};

// Xoá playlist
export const deletePlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.auth.userId;

  try {
    const deleted = await Playlist.findOneAndDelete({ _id: playlistId, owner: userId });
    if (!deleted) return res.status(404).json({ error: "Playlist không tồn tại hoặc không thuộc bạn" });

    res.status(200).json({ message: "Đã xoá playlist" });
  } catch (err) {
    res.status(500).json({ error: "Không thể xoá playlist" });
  }
};

// Xoá bài hát khỏi playlist
export const removeSongFromPlaylist = async (req, res) => {
  const { playlistId, songId } = req.body;
  const userId = req.auth.userId;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });
    if (!playlist) return res.status(404).json({ error: "Playlist không tồn tại hoặc không thuộc bạn" });

    playlist.songs = playlist.songs.filter(entry => entry.song.toString() !== songId);
    await playlist.save();

    res.status(200).json(playlist);
  } catch (err) {
    res.status(500).json({ error: "Không thể xoá bài hát khỏi playlist" });
  }
};

// Sắp xếp lại thứ tự bài hát trong playlist
export const reorderPlaylistSongs = async (req, res) => {
  const { playlistId, newOrder } = req.body; // newOrder: array of songIds
  const userId = req.auth.userId;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });
    if (!playlist) return res.status(404).json({ error: "Playlist không tồn tại hoặc không thuộc bạn" });

    const newSongList = [];
    for (const songId of newOrder) {
      const found = playlist.songs.find(entry => entry.song.toString() === songId);
      if (!found) return res.status(400).json({ error: "Danh sách bài hát không hợp lệ" });
      newSongList.push(found);
    }

    playlist.songs = newSongList;
    await playlist.save();

    res.status(200).json(playlist);
  } catch (err) {
    res.status(500).json({ error: "Không thể sắp xếp lại playlist" });
  }
};

// Lấy tất cả playlist công khai
export const getPublicPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true }).populate({
      path: "songs.song",
      populate: { path: "artist", select: "name imageUrl" }
    });
    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy playlist công khai" });
  }
};

// Lấy playlist công khai theo ID
export const getPublicPlaylistById = async (req, res) => {
  const { playlistId } = req.params;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, isPublic: true }).populate({
      path: "songs.song",
      populate: { path: "artist", select: "name imageUrl" }
    });

    if (!playlist) return res.status(404).json({ error: "Playlist không tồn tại hoặc không công khai" });

    res.status(200).json(playlist);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy playlist" });
  }
};

// Đổi tên hoặc cập nhật chế độ công khai
export const updatePlaylist = async (req, res) => {
  const { id } = req.params;
  const { name, isPublic } = req.body;
  const userId = req.auth.userId;

  try {
    const updated = await Playlist.findOneAndUpdate(
      { _id: id, owner: userId },
      { ...(name && { name }), ...(isPublic !== undefined && { isPublic }) },
      { new: true }
    ).populate({
      path: "songs.song",
      populate: { path: "artist", select: "name imageUrl" }
    });

    if (!updated) return res.status(404).json({ error: "Playlist không tồn tại hoặc không thuộc bạn" });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Không thể cập nhật playlist", details: err.message });
  }
};

// Lấy playlist theo ID (check quyền truy cập)
export const getPlaylistById = async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.userId;

  try {
    const playlist = await Playlist.findById(id).populate({
      path: "songs.song",
      populate: { path: "artist", select: "name imageUrl" }
    });

    if (!playlist) return res.status(404).json({ error: "Playlist không tồn tại" });

    if (!playlist.isPublic && playlist.owner !== userId)
      return res.status(403).json({ error: "Không có quyền truy cập playlist này" });

    res.status(200).json(playlist);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy playlist" });
  }
};
