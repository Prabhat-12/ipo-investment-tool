import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA service worker only in production and not on localhost/loopback origins
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.hostname !== '[::1]') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Automatically unregister existing service workers and clear cache on localhost during development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      let unregisteredAny = false;
      for (const registration of registrations) {
        registration.unregister();
        unregisteredAny = true;
      }
      if (unregisteredAny) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
          // Force reload to grab fresh assets from Vite
          window.location.reload(true);
        });
      }
    });
  }
}
