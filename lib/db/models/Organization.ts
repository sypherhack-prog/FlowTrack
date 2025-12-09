// lib/db/models/Organization.ts
import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    size: { type: String },
    timeTrackingMode: {
      type: String,
      enum: ['web_app', 'all_platforms', 'silent_app'],
      default: 'web_app',
    },
    goals: [{ type: String }],
    plan: { type: String, default: 'trial' },
    trialEndsAt: { type: Date },
    billingPeriod: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  },
  { timestamps: true },
);

export default mongoose.models.Organization ||
  mongoose.model('Organization', organizationSchema);
