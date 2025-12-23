import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.tsx';
import { StarboardClientProvider } from './contexts/StarboardClient.provider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StarboardClientProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StarboardClientProvider>
  </StrictMode>
);
