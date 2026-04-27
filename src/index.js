import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Ensure RPG styles are loaded
import './styles/rpgComponents.css';
import './styles/rpgAnimations.css';
import App from './AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary showDetails={true}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register service worker for PWA (Loomwright)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('[Loomwright] Service Worker registered:', registration.scope);

        // When the waiting SW becomes installed and there is already a controller,
        // we have a new version ready. Tell it to activate immediately.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Loomwright] New build available. Activating...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((error) => {
        console.log('[Loomwright] Service Worker registration failed:', error);
      });

    // When the SW activates a new shell it posts LOOMWRIGHT_UPDATED. Reload once
    // per activation so the user instantly sees the new build without manually
    // refreshing or clearing site data. A sessionStorage flag prevents loops.
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'LOOMWRIGHT_UPDATED') {
        if (!sessionStorage.getItem('lw-reloaded-for-update')) {
          sessionStorage.setItem('lw-reloaded-for-update', '1');
          window.location.reload();
        }
      }
    });

    // Clear the reload flag when the controller changes normally, so future
    // updates will trigger a reload again.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      sessionStorage.removeItem('lw-reloaded-for-update');
    });
  });
}
