'use client';

import { useEffect, useState } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const TOAST_EVENT = 'flowtrack:toast';

let audioCtx: AudioContext | null = null;

function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }

    const ctx = audioCtx!;
    const now = ctx.currentTime;

    const makeTone = (frequency: number, offset: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + offset;
      const endTime = startTime + duration;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.start(startTime);
      osc.stop(endTime + 0.05);
    };

    // Petit chime en deux notes, proche d'une notif système
    makeTone(1040, 0, 0.14, 0.25);
    makeTone(1480, 0.14, 0.16, 0.22);
  } catch {
  }
}

export function ToastCenter() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string; type?: ToastType }>;
      const detail = custom.detail || {};
      const message = detail.message || '';
      if (!message) return;

      const type: ToastType = detail.type || 'info';
      const id = Date.now() + Math.random();

      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        // On limite à 3 toasts visibles pour ne pas saturer l'écran
        if (next.length > 3) {
          return next.slice(next.length - 3);
        }
        return next;
      });
      playNotificationSound();

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(TOAST_EVENT, handler as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(TOAST_EVENT, handler as EventListener);
      }
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const base =
          'max-w-xs rounded-lg shadow-md px-3 py-2 text-xs flex items-start gap-2 border';
        const byType: Record<ToastType, string> = {
          info: 'bg-blue-50 text-blue-800 border-blue-200',
          success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          warning: 'bg-amber-50 text-amber-800 border-amber-200',
          error: 'bg-red-50 text-red-800 border-red-200',
        };

        return (
          <div key={toast.id} className={`${base} ${byType[toast.type]}`}>
            <span className="mt-0.5 h-2 w-2 rounded-full bg-current" />
            <p className="flex-1 leading-snug">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
