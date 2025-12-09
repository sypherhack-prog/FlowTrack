'use client';

import { useEffect } from 'react';

export function BlockedSitesWatcher() {
  useEffect(() => {
    import('@/lib/blocked-sites').catch(() => {
      // ignore
    });
  }, []);

  return null;
}
