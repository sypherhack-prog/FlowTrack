// lib/db/models/BlockedSiteRule.ts
import mongoose from 'mongoose';

const blockedSiteRuleSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    pattern: { type: String, required: true },
    label: { type: String },
  },
  { timestamps: true },
);

blockedSiteRuleSchema.index({ organizationId: 1, pattern: 1 }, { unique: true });

export default mongoose.models.BlockedSiteRule ||
  mongoose.model('BlockedSiteRule', blockedSiteRuleSchema);
