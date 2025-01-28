// React
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Root
import App from './App.tsx';

// CSS
import './assets/index.css';


// Render ke HTML
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
