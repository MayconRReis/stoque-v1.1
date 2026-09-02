
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { isFetchOrNetworkError } from './lib/supabase';

// Prevent uncaught network/fetch rejections from crashing the runtime
window.addEventListener('unhandledrejection', (event) => {
  if (isFetchOrNetworkError(event.reason)) {
    console.warn('Unhandled network/fetch rejection prevented:', event.reason);
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
