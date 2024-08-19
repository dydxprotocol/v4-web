import { datadogLogs } from '@datadog/browser-logs';

const CLIENT_TOKEN = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
const LOGGER_NAME = 'v4-web';

if (CLIENT_TOKEN) {
  datadogLogs.init({
    clientToken: CLIENT_TOKEN,
    site: 'datadoghq.com',
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });
}

datadogLogs.createLogger(LOGGER_NAME);

const datadogLogger = datadogLogs.getLogger(LOGGER_NAME)!!;

/**
 * TODO: make a logger wrapper that enables us also log to the console
 * https://linear.app/dydx/issue/OTE-718/[web]-default-to-console-methods-if-no-client-token-available
 */
export const dd = datadogLogger;
