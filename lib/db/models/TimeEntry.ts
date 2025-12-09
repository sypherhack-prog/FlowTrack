// lib/db/models/TimeEntry.ts
import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    task: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    seconds: { type: Number, required: true },
    activityLog: [
      {
        ts: { type: Number, required: true },
        level: { type: String, enum: ['active', 'idle', 'away'], required: true },
      },
    ],
    screenshotUrls: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.TimeEntry || mongoose.model('TimeEntry', timeEntrySchema);
