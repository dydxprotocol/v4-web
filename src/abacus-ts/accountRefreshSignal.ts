import { appQueryClient } from '@/state/appQueryClient';

import { Signal } from './signal';

// triggers when we got fresh parent subaccount data from the websocket for any reason
// mostly network reconnects, refreshes, page visibility changes, etc
export const accountRefreshSignal = new Signal();

export function refreshIndexerQueryOnAccountSocketRefresh(key: any[]) {
  return accountRefreshSignal.onTrigger(() =>
    appQueryClient.invalidateQueries({ queryKey: ['indexer', ...key], exact: false })
  );
}
