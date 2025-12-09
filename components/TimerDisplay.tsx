'use client';
import { useTimer } from '@/app/tracker/TimerProvider';

export function TimerDisplay() {
  const { isRunning, seconds, stop, projectId } = useTimer();

  const format = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  if (!isRunning) return null;

  return (
    <div className="fixed bottom-8 right-8 bg-black text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 z-50">
      <div>
        <div className="text-2xl font-bold">{format(seconds)}</div>
        <div className="text-sm opacity-70">Projet: {projectId}</div>
      </div>
      <button onClick={stop} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
        Stop
      </button>
    </div>
  );
}