import { timeUnits } from '@/constants/time';

import { log, logInfo } from '@/lib/telemetry';

export function logBonsaiError(source: string, message: string, ...args: any[]) {
  log(`bonsai: ${source}: ${message}`, args[0]?.error, { context: args });
}

export function logBonsaiInfo(source: string, message: string, ...args: any[]) {
  logInfo(`bonsai: ${source}: ${message}`, { context: args });
}

export const LONG_REQUEST_LOG_THRESHOLD_MS = timeUnits.second * 10;
// if requests take longer than 60 seconds it's almost certainly because the browser
// limited our resources so we couldn't handle the request completing
export const OBVIOUSLY_TOO_LONG_REQUEST_LOG_THRESHOLD_MS = timeUnits.second * 60;

export function wrapAndLogBonsaiError<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T> | T,
  logId: string
): (...args: Args) => Promise<T> {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await Promise.resolve(fn(...args));
      const duration = Date.now() - start;
      if (
        duration > LONG_REQUEST_LOG_THRESHOLD_MS &&
        duration < OBVIOUSLY_TOO_LONG_REQUEST_LOG_THRESHOLD_MS
      ) {
        logBonsaiInfo(
          logId,
          `Long request time detected for ${logId}: ${Math.floor(duration / 1000)}s`,
          {
            duration,
            source: logId,
          }
        );
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logBonsaiError(logId, `Error fetching ${logId} data`, { error, duration, source: logId });
      throw error;
    }
  };
}
