import './polyfills';

import { lazy, StrictMode, Suspense } from 'react';

import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, HashRouter } from 'react-router-dom';

import { storeLifecycles } from './bonsai/storeLifecycles';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpace } from './components/Loading/LoadingSpinner';
import './index.css';
import { runFn } from './lib/do';
import { store } from './state/_store';

const Router = import.meta.env.VITE_ROUTER_TYPE === 'hash' ? HashRouter : BrowserRouter;

runFn(async () => {
  // we ignore the cleanups for now since we want these running forever
  storeLifecycles.forEach((fn) => fn(store));
});

// lazy import the app so we can start up bonsai before the app chugs into being
const App = lazy(() => import('@/App'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <StrictMode>
      <Provider store={store}>
        <Router>
          <Suspense fallback={<LoadingSpace id="main" tw="h-full w-full" />}>
            <App />
          </Suspense>
        </Router>
      </Provider>
    </StrictMode>
  </ErrorBoundary>
);
