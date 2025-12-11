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
    planExpiresAt: { type: Date },
  },
  { timestamps: true },
);
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ plan: 1 });
organizationSchema.index({ timeTrackingMode: 1 });
organizationSchema.index({ createdAt: -1 });

export default mongoose.models.Organization ||
  mongoose.model('Organization', organizationSchema);
