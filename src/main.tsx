import './polyfills';
import { Fragment, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import { store } from '@/state/_store';

import { ErrorBoundary } from './components/ErrorBoundary';

import './index.css';

import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <HashRouter children={<App />} />
      </Provider>
    </StrictMode>
  </ErrorBoundary>
);
