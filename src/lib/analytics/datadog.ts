import { datadogLogs } from '@datadog/browser-logs';

import { CURRENT_MODE } from '@/constants/networks';

const CLIENT_TOKEN = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
const SERVICE_NAME = import.meta.env.VITE_DATADOG_SERVICE_NAME ?? 'v4-web-frontend-unknown-source';
const LOGGER_NAME = 'v4-web';
const SITE_NAME = 'datadoghq.com';

if (CLIENT_TOKEN) {
  datadogLogs.init({
    clientToken: CLIENT_TOKEN,
    site: SITE_NAME,
    service: SERVICE_NAME,
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
    env: CURRENT_MODE,
  });
}

datadogLogs.createLogger(LOGGER_NAME);

const datadogLogger = datadogLogs.getLogger(LOGGER_NAME)!!;
datadogLogger.setContextProperty('dd_client_token', CLIENT_TOKEN);

/**
 * TODO: make a logger wrapper that enables us also log to the console
 * https://linear.app/dydx/issue/OTE-718/[web]-default-to-console-methods-if-no-client-token-available
 */
export const dd = datadogLogger;
