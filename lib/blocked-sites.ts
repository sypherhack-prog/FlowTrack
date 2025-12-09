// lib/blocked-sites.ts
export const BLOCKED_SITES = [
  'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'netflix.com', 'twitter.com', 'x.com'
];

export const isBlocked = () => {
  return BLOCKED_SITES.some(site => location.hostname.includes(site));
};

if (typeof window !== 'undefined' && isBlocked()) {
  fetch('/api/track/blocked', {
    method: 'POST',
    body: JSON.stringify({ url: location.href }),
    keepalive: true,
  });
  // Optionnel : rediriger
  // location.href = 'https://flowtrack.pro/blocked';
}