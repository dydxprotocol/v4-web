import { isDev } from "@/constants/networks";

export const log = (location: string, error: Error, metadata?: any) => {
  if (isDev) {
    console.warn('telemetry/log:', { location, error, metadata });
  }

  const customEvent = new CustomEvent('dydx:log', {
    detail: {
      location,
      error,
      metadata,
    },
  });

  globalThis.dispatchEvent(customEvent);
};

// Log rejected Promises without a .catch() handler
globalThis.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();

  log(
    'window/onunhandledrejection',
    new Error(`Promise rejected and uncaught; reason: ${event.reason}`)
  );
});

// Log rejected Promises that are caught late (handler attached at a later time)
globalThis.addEventListener(
  'rejectionhandled',
  (event) => {
    event.preventDefault();

    log(
      'window/onrejectionhandled',
      new Error(`Promise rejected and caught late; reason: ${event.reason}`)
    );
  },
  false
);
