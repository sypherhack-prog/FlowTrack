// lib/db/models/Invitation.ts
import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, enum: ['manager', 'member'], default: 'member' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    token: { type: String, unique: true, index: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.Invitation ||
  mongoose.model('Invitation', invitationSchema);
