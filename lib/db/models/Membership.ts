// lib/db/models/Membership.ts
import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'manager', 'member'], default: 'member' },
  },
  { timestamps: true },
);

export default mongoose.models.Membership ||
  mongoose.model('Membership', membershipSchema);
