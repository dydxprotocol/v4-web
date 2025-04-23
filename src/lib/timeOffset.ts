import { logBonsaiInfo, wrapAndLogBonsaiError } from '@/bonsai/logs';
import { utils } from '@dydxprotocol/v4-client-js';
import { isFinite } from 'lodash';

import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { calc, mapIfPresent } from './do';
import { removeTrailingSlash } from './stringifyHelpers';
import { sleep } from './timeUtils';

const MAX_TIME_TO_WAIT_FOR_FAST_REQUEST = 10000;

async function getTimestampOffset() {
  // create two promises that never throw and race them
  const offsetPromise = calc(async () => {
    try {
      const networkConfig = ENVIRONMENT_CONFIG_MAP[DEFAULT_APP_ENVIRONMENT];
      const indexerUrl = mapIfPresent(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        networkConfig?.endpoints.indexers[0]?.api,
        removeTrailingSlash
      );
      const start = Date.now();
      const res = await wrapAndLogBonsaiError(
        () => fetch(`${indexerUrl}/v4/time`, { method: 'GET' }),
        'timeOffset'
      )();
      const end = Date.now();

      const serverDate = (await res.json()).iso;
      if (serverDate == null) {
        return 0;
      }
      const serverMs = Date.parse(serverDate);
      if (!isFinite(serverMs)) {
        return 0;
      }
      return utils.calculateClockOffsetFromFetchDateHeader(start, serverMs, end);
    } catch (e) {
      return 0;
    }
  });
  const defaultPromise = calc(async () => {
    try {
      await sleep(MAX_TIME_TO_WAIT_FOR_FAST_REQUEST);
      return 0;
    } catch (e) {
      return 0;
    }
  });

  const start = Date.now();
  const offset = await Promise.race([offsetPromise, defaultPromise]);
  return {
    offset,
    requestDuration: Date.now() - start,
  };
}

export const browserTimeOffsetPromise = sleep(0).then(() => getTimestampOffset());
browserTimeOffsetPromise.then((result) => {
  logBonsaiInfo('browserTimeOffsetCalculator', 'calculated time offset', result);
});
