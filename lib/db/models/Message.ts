// lib/db/models/Message.ts
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true },
);
messageSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
