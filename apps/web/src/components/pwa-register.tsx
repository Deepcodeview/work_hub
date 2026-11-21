'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('WorkHub Service Worker active with scope:', reg.scope);
          })
          .catch((err) => {
            console.log('Service Worker registration note:', err);
          });
      });
    }
  }, []);

  return null;
}
