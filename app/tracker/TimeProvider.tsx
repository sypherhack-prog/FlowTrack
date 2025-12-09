'use client';
import { create } from 'zustand';
import { io } from 'socket.io-client';

let timerId: ReturnType<typeof setInterval> | null = null;
let socket: ReturnType<typeof io> | null = null;

interface State {
  isRunning: boolean;
  seconds: number;
  projectId: string | null;
  activityLevel: 'active' | 'idle' | 'away';
  start: (projectId: string) => Promise<void>;
  stop: () => Promise<void>;
  setActivityLevel: (level: 'active' | 'idle' | 'away') => void;
}

export const useTimer = create<State>((set, get) => ({
  isRunning: false,
  seconds: 0,
  projectId: null,
  activityLevel: 'active',

  start: async (projectId) => {

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    await fetch('/api/track/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    timerId = setInterval(() => {
      set((s) => ({ seconds: s.seconds + 1 }));

      const state = get();
      const nextSeconds = state.seconds;

      const payload = {
        seconds: nextSeconds,
        projectId: state.projectId ?? '',
        level: state.activityLevel,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        app: typeof document !== 'undefined' ? document.title : undefined,
      };

      socket?.emit('heartbeat', payload as any);
    }, 1000);

    set({ isRunning: true, projectId, seconds: 0, activityLevel: 'active' });
  },

  stop: async () => {
    await fetch('/api/track/stop', { method: 'POST' });

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    set({ isRunning: false, seconds: 0, projectId: null, activityLevel: 'active' });
  },
  setActivityLevel: (level) => set({ activityLevel: level }),
}));