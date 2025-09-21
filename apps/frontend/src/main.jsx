import './styles/base.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Providers from './app/providers.jsx';
import AppRouter from './app/router.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </React.StrictMode>
);
