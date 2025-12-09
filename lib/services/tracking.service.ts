// lib/services/tracking.service.ts
import mongoose from 'mongoose';
import { connectDB } from '../db/mongodb';
import TimeEntry from '../db/models/TimeEntry';

interface TrackingSession {
  userId: string;
  projectId: string;
  task?: string;
  startTime: Date;
  lastHeartbeat: Date;
  seconds: number;
  activityLog: { ts: number; level: 'active' | 'idle' | 'away' }[];
  screenshotUrls: string[];
}

const sessions = new Map<string, TrackingSession>();

export class TrackingService {
  static async start(userId: string, projectId: string, task?: string) {
    await connectDB();

    const session: TrackingSession = {
      userId,
      projectId,
      task,
      startTime: new Date(),
      lastHeartbeat: new Date(),
      seconds: 0,
      activityLog: [],
      screenshotUrls: [],
    };

    sessions.set(userId, session);
  }

  static async heartbeat(userId: string, level: 'active' | 'idle' | 'away' = 'active') {
    const session = sessions.get(userId);
    if (!session) return;

    const now = Date.now();
    const diffSeconds = Math.floor((now - session.lastHeartbeat.getTime()) / 1000);
    session.seconds += diffSeconds;
    session.lastHeartbeat = new Date();

    session.activityLog.push({ ts: now, level });
  }

  static async stop(userId: string) {
    const session = sessions.get(userId);
    if (!session) return null;

    // Complète la durée jusqu'au moment de l'arrêt
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - session.lastHeartbeat.getTime()) / 1000);
    session.seconds += Math.max(0, diffSeconds);
    session.lastHeartbeat = now;

    // Persistance dans MongoDB
    await connectDB();

    const projectId = mongoose.Types.ObjectId.isValid(session.projectId)
      ? new mongoose.Types.ObjectId(session.projectId)
      : undefined;

    await TimeEntry.create({
      userId: session.userId,
      projectId,
      task: session.task,
      startTime: session.startTime,
      endTime: now,
      seconds: session.seconds,
      activityLog: session.activityLog,
      screenshotUrls: session.screenshotUrls,
    });

    sessions.delete(userId);
    return session;
  }

  static addScreenshot(userId: string, url: string) {
    const session = sessions.get(userId);
    if (session) {
      session.screenshotUrls.push(url);
    }
  }

  static getSession(userId: string) {
    return sessions.get(userId);
  }
}