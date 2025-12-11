// lib/db/models/BlockedEvent.ts
import mongoose from 'mongoose';

const blockedEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
  },
  { timestamps: true },
);
blockedEventSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.BlockedEvent || mongoose.model('BlockedEvent', blockedEventSchema);
