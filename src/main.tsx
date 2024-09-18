import './polyfills';

import { StrictMode } from 'react';

import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, HashRouter } from 'react-router-dom';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { initHookLifecycles } from './state/_hookLifecycles';
import { store } from './state/_store';

const Router = import.meta.env.VITE_ROUTER_TYPE === 'hash' ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <Router>
          <App />
        </Router>
      </Provider>
    </StrictMode>
  </ErrorBoundary>
);

initHookLifecycles();
