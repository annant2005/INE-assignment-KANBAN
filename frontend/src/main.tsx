import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/App';
import { AuthProvider } from './contexts/AuthContext';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

useEffect(() => {
  const ws = new WebSocket('ws://localhost:3000');
  ws.onmessage = (event) => {
    // Handle board/card/column updates here
    const data = JSON.parse(event.data);
    // Update state/UI accordingly
  };
  return () => ws.close();
}, []);
