import './polyfills';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import { store } from '@/state/_store';

import { ErrorBoundary } from './components/ErrorBoundary';

import './index.css';

import App from './App';

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
