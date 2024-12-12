import { ResourceCacheManager } from '../../lib/resourceCacheManager';
import { IndexerWebsocket } from './indexerWebsocket';

export const IndexerWebsocketManager = new ResourceCacheManager({
  constructor: (wsUrl: string) => new IndexerWebsocket(wsUrl),
  destroyer: (obj) => obj.teardown(),
  keySerializer: (str) => str,
});
