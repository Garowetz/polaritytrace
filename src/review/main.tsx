import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import '../styles/base.css';
import { PartsPage } from './PartsPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PartsPage />
  </StrictMode>,
);
