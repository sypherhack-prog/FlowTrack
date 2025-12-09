// types/tracking.d.ts
import 'socket.io-client';

export type ActivityLevel = 'active' | 'idle' | 'away';

export interface LiveActivityData {
  userId: string;
  seconds: number;
  projectId: string;
  activityLevel: number;
  app?: string;
  url?: string;
}

export interface HeartbeatData {
  seconds: number;
  projectId: string;
  level: ActivityLevel;
  app?: string;
  url?: string;
}

export interface TrackingSession {
  userId: string;
  projectId: string;
  task?: string;
  startTime: Date;
  seconds: number;
  screenshots: string[];
}

declare module 'socket.io-client' {
  interface Socket {
    on(event: 'live-activity', listener: (data: LiveActivityData) => void): this;
    on(event: 'live-users-update', listener: (count: number) => void): this;
    emit(event: 'heartbeat', data: HeartbeatData): boolean;
  }
}