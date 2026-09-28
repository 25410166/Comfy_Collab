import mongoose from 'mongoose';
import { config } from '../config.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[MongoDB] Connected successfully to ${config.mongoUri}`);
    return conn;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err);
    throw err;
  }
}
