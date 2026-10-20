import mongoose from 'mongoose';
import { options, ref } from './shared.js';

const schema = new mongoose.Schema({
  fromId: ref('User'),
  toId: ref('User'),
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
}, options('friendships', { timestamps: true }));
schema.index({ fromId: 1, toId: 1 }, { unique: true });

export const Friendship = mongoose.model('Friendship', schema);
