import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(uri);
}

