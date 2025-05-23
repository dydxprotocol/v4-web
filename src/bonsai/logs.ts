import { timeUnits } from '@/constants/time';

import { getDurationSinceLastLogMs, log, logInfo } from '@/lib/telemetry';

import { SharedLogIds } from './logIds';

export const BONSAI_DETAILED_LOGS: boolean = false;

export function logBonsaiError(source: string, message: string, ...args: any[]) {
  log(`bonsai: ${source}: ${message}`, args[0]?.error, { context: args });
}

export function logBonsaiInfo(source: string, message: string, ...args: any[]) {
  logInfo(`bonsai: ${source}: ${message}`, { context: args });
}

export const LONG_REQUEST_LOG_THRESHOLD_MS = timeUnits.second * 5;
// if requests take longer than 60 seconds it's almost certainly because the browser
// limited our resources so we couldn't handle the request completing
export const OBVIOUSLY_TOO_LONG_REQUEST_LOG_THRESHOLD_MS = timeUnits.second * 60;

// if we are making requests then we should make sure we are logging at least once every few minutes
// so that statistical analysis of the logs using 5m buckets or larger are valid
// otherwise we can imagine a situation where we are only logging errors and we have no idea
// what the actual frequency of the errors is since we don't know how many sessions are actively making
// requests that could fail
export const EFFECTIVE_HEARTBEAT_LOG_LIFETIME_MS = timeUnits.minute * 5;

export const REQUEST_TIME_SAMPLE_RATE = 0.015;

const logIdsToRateLimit = new Set<string>([
  SharedLogIds.INDEXER_HEIGHT,
  SharedLogIds.VALIDATOR_HEIGHT,
  SharedLogIds.INDEXER_HEIGHT_INNER,
  SharedLogIds.VALIDATOR_HEIGHT_INNER,
]);

export function wrapAndLogBonsaiError<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T> | T,
  logId: string
): (...args: Args) => Promise<T> {
  return async (...args) => {
    if (getDurationSinceLastLogMs() > EFFECTIVE_HEARTBEAT_LOG_LIFETIME_MS) {
      logBonsaiInfo('wrapAndLogBonsaiError', 'Session activity heartbeat');
    }
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
      const sampleRate = logIdsToRateLimit.has(logId)
        ? REQUEST_TIME_SAMPLE_RATE / 10
        : REQUEST_TIME_SAMPLE_RATE;
      if (Math.random() < sampleRate) {
        logBonsaiInfo(logId, `Request time for ${logId}: ${Math.floor(duration / 1000)}s`, {
          duration,
          source: logId,
        });
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logBonsaiError(logId, `Error fetching ${logId} data`, { error, duration, source: logId });
      throw error;
    }
  };
}
