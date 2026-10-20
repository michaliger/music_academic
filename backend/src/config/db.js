import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDb = () => mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
