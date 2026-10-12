'use client';

import { useEffect } from 'react';

export default function RecentlyViewedTracker({ id }: { id: string }) {
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem('esphacio-recent') || '[]');
      const ids = Array.isArray(current) ? current.filter(value => typeof value === 'string') : [];
      localStorage.setItem('esphacio-recent', JSON.stringify([id, ...ids.filter(value => value !== id)].slice(0, 5)));
    } catch { /* local browser storage is optional */ }
  }, [id]);

  return null;
}