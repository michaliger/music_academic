import { Song } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSong } from '../services/song.service.js';

export const createSong = asyncHandler(async (req, res) => {
  const data = await generateSong(req.body);
  const song = await Song.create({ userId: req.user.id, title: data.title, params: req.body, data });
  res.status(201).json(song.toJSON());
});

export const listSongs = asyncHandler(async (req, res) => {
  res.json((await Song.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30)).map((s) => s.toJSON()));
});

export const deleteSong = asyncHandler(async (req, res) => {
  await Song.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ ok: true });
});
