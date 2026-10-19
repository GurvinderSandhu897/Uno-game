import mongoose from 'mongoose';

/** Returns true if connected. Never throws: the game works without a DB. */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('No MONGO_URI set. Running in memory-only mode.');
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.warn('MongoDB unavailable, running in memory-only mode:', err.message);
    return false;
  }
}