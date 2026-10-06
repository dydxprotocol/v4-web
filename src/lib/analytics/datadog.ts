import { datadogLogs } from '@datadog/browser-logs';

import { CURRENT_MODE } from '@/constants/networks';

const CLIENT_TOKEN = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
const PROXY_URL = import.meta.env.VITE_DATADOG_PROXY_URL;
const SERVICE_NAME = 'v4-web';
const LOGGER_NAME = 'v4-web';
const SITE_NAME = 'datadoghq.com';
const instanceId = crypto.randomUUID();

// forwardErrorsToLogs stays on for uncaught exceptions; console and network errors are dropped
const DROPPED_ORIGINS = new Set(['console', 'network']);
// Only guards logs that nest their payload under `context` (logBonsaiError / logBonsaiInfo).
// Other callers' metadata is merged into the top level of the event and is not checked.
const MAX_CONTEXT_CHARS = 8 * 1024;

const LOG_ENDPOINT_PATH = (PROXY_URL ?? '').endsWith('/') ? 'api/v2/logs' : '/api/v2/logs';

if (CLIENT_TOKEN) {
  datadogLogs.init({
    clientToken: CLIENT_TOKEN,
    site: SITE_NAME,
    service: SERVICE_NAME,
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
    env: CURRENT_MODE,
    proxy: PROXY_URL ? `${PROXY_URL}${LOG_ENDPOINT_PATH}` : undefined,
    sendLogsAfterSessionExpiration: true,
    beforeSend: (event) => {
      if (DROPPED_ORIGINS.has(event.origin)) return false;

      const contextSize = JSON.stringify(event.context ?? null).length;
      if (contextSize > MAX_CONTEXT_CHARS) {
        event.context = { truncated: true, originalSize: contextSize };
      }
      return true;
    },
  });
}

datadogLogs.createLogger(LOGGER_NAME);

const datadogLogger = datadogLogs.getLogger(LOGGER_NAME)!;
datadogLogger.setContextProperty('dd-client-token', CLIENT_TOKEN);
datadogLogger.setContextProperty('instance-id', instanceId);

/**
 * TODO: make a logger wrapper that enables us also log to the console
 * https://linear.app/dydx/issue/OTE-718/[web]-default-to-console-methods-if-no-client-token-available
 */
export const dd = datadogLogger;
