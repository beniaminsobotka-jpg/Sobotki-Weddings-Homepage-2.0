import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Analytics
      beforeSend={(event) => (/\/(?:panel|best-of)\//.test(new URL(event.url, window.location.origin).pathname) ? null : event)}
    />
  </React.StrictMode>
);
