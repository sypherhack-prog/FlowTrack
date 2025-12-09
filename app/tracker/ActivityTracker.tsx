'use client';

import { useEffect, useRef } from 'react';
import { useTimer } from './TimerProvider';

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export function ActivityTracker() {
  const { isRunning, setActivityLevel } = useTimer();
  const lastActivity = useRef(Date.now());

  const sendHeartbeat = debounce(() => {
    if (!isRunning) return;

    setActivityLevel('active');

    fetch('/api/track/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'active' }),
      keepalive: true,
    });
  }, 3000);

  useEffect(() => {
    if (!isRunning) return;

    const events: (keyof DocumentEventMap)[] = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handler = () => {
      lastActivity.current = Date.now();
      sendHeartbeat();
    };

    events.forEach((ev) => document.addEventListener(ev, handler, { passive: true }));

    const idleInterval = setInterval(() => {
      if (Date.now() - lastActivity.current > 60000) {
        setActivityLevel('idle');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('flowtrack:toast', {
              detail: {
                type: 'warning',
                message: 'You have been idle for more than 1 minute.',
              },
            }),
          );
        }
        fetch('/api/track/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 'idle' }),
          keepalive: true,
        });
      }
    }, 10000);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, handler));
      clearInterval(idleInterval);
      sendHeartbeat.cancel();
    };
  }, [isRunning, sendHeartbeat, setActivityLevel]);

  useEffect(() => {
    if (!isRunning) return;

    const handleVisibility = () => {
      const isHidden = document.visibilityState === 'hidden';

      const level: 'active' | 'idle' | 'away' = isHidden ? 'away' : 'active';
      setActivityLevel(level);

      if (typeof window !== 'undefined' && level === 'away') {
        window.dispatchEvent(
          new CustomEvent('flowtrack:toast', {
            detail: {
              type: 'warning',
              message: 'You are away from your screen.',
            },
          }),
        );
      }

      fetch('/api/track/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
        keepalive: true,
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRunning, setActivityLevel]);

  return null;
}