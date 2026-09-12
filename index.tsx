import React from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Service Worker Management for PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isIframe = window.self !== window.top;
  const isDev = Boolean((import.meta as any).env?.DEV);

  if (isIframe || isDev) {
    // In development mode or inside an iframe, proactively unregister any active service workers
    // to prevent cross-origin iframe update failures and dev-server caching conflicts.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  } else {
    // Top-level production environment: safely register the service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content is available; please refresh.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration skipped or failed:', error);
        });
    });
  }
}
