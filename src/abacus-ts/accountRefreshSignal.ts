import { min } from 'lodash';

import { timeUnits } from '@/constants/time';

import { appQueryClient } from '@/state/appQueryClient';

import { Signal } from './lib/signal';

// triggers when we got fresh parent subaccount data from the websocket for any reason
// mostly network reconnects, refreshes, page visibility changes, etc
export const accountRefreshSignal = new Signal();

const BUFFER_REFRESH_TIME = timeUnits.second * 5;

export function refreshIndexerQueryOnAccountSocketRefresh(key: any[]) {
  return accountRefreshSignal.onTrigger(() => {
    // we don't refresh if all data was updated within the last few seconds
    const minTime = min(
      appQueryClient
        .getQueryCache()
        .findAll({ queryKey: ['indexer', ...key], exact: false })
        .map((q) => q.state.dataUpdatedAt)
    );
    if ((minTime ?? 0) < new Date().valueOf() - BUFFER_REFRESH_TIME) {
      appQueryClient.invalidateQueries({ queryKey: ['indexer', ...key], exact: false });
    }
  });
}
