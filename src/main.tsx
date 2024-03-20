import { StrictMode } from 'react';

import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, HashRouter } from 'react-router-dom';

import { store } from '@/state/_store';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const Router = import.meta.env.VITE_ROUTER_TYPE === 'hash' ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <Router children={<App />} />
      </Provider>
    </StrictMode>
  </ErrorBoundary>
);
