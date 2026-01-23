import { AnalyticsEvents } from '@/constants/analytics';
import { isDev } from '@/constants/networks';

import { track } from './analytics/analytics';
import { dd } from './analytics/datadog';

const FRONTEND = 'bonk';

let lastLogTime = Date.now();

export function getDurationSinceLastLogMs() {
  return Date.now() - lastLogTime;
}

export const log = (location: string, error?: Error, metadata?: object) => {
  const modifiedMetadata = { ...metadata, frontend: FRONTEND };
  lastLogTime = Date.now();
  if (isDev) {
    // eslint-disable-next-line no-console
    console.warn('telemetry/log:', { location, error, metadata: modifiedMetadata });
  }

  const customEvent = new CustomEvent('dydx:log', {
    detail: {
      location,
      error,
      metadata: modifiedMetadata,
    },
  });

  track(
    AnalyticsEvents.Error({
      location,
      error,
      metadata: modifiedMetadata,
    })
  );

  dd.error(`[Error] ${location}`, { ...metadata, frontend: FRONTEND }, error);

  globalThis.dispatchEvent(customEvent);
};

export const logInfo = (location: string, metadata?: object) => {
  lastLogTime = Date.now();
  const modifiedMetadata = { ...metadata, frontend: FRONTEND };

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log('telemetry/logInfo:', { location, metadata: modifiedMetadata });
  }

  dd.info(`[Info] ${location}`, { ...metadata, frontend: FRONTEND });
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
