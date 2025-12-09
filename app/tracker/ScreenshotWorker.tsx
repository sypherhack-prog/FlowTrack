'use client';

import { useEffect } from 'react';
import html2canvas from 'html2canvas';

import { useTimer } from './TimerProvider';

export function ScreenshotWorker() {
  const { isRunning } = useTimer();

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(async () => {
      try {
        const canvas = await html2canvas(document.body, { scale: 0.5, useCORS: true });
        const ctx = canvas.getContext('2d');

        if (ctx) {
          document
            .querySelectorAll<HTMLInputElement>('input[type=password], input[type=text], input[type=email]')
            .forEach((el) => {
              const rect = el.getBoundingClientRect();
              ctx.filter = 'blur(12px)';
              ctx.fillStyle = '#000';
              ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            });
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/webp', 0.6),
        );

        if (!blob) return;

        const form = new FormData();
        form.append('screenshot', blob, 'screen.webp');
        form.append('url', window.location.href);
        form.append('title', document.title);
        navigator.sendBeacon('/api/track/screenshot', form);
      } catch (error) {
        console.error('ScreenshotWorker error', error);
      }
    }, 20_000); // 20 secondes en mode "turbo"

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  return null;
}