import { IndexerClient, IndexerConfig } from '@dydxprotocol/v4-client-js';

import { ResourceCacheManager } from '../resourceCacheManager';

export const IndexerClientManager = new ResourceCacheManager({
  constructor: ({ wsUrl, url }: { url: string; wsUrl: string }) =>
    new IndexerClient(new IndexerConfig(url, wsUrl)),
  destroyer: () => null,
  keySerializer: ({ url, wsUrl }) => `${url}/////////${wsUrl}`,
});
