import { ResourceCacheManager } from '@/bonsai/lib/resourceCacheManager';
import stableStringify from 'fast-json-stable-stringify';

import { IndexerWebsocket } from './indexerWebsocket';
import { IndexerWebsocketManager } from './indexerWebsocketManager';
import { WebsocketDerivedValue } from './websocketDerivedValue';

// this is set to just above the websocket subscribe timeout because of race conditions in the indexer backend
const DESTROY_DELAY_MS = 23000;

type WebsocketValueCreator<Args, ReturnType> = (
  websocket: IndexerWebsocket,
  args: Args
) => WebsocketDerivedValue<ReturnType>;

export function makeWsValueManager<Args, ReturnType>(
  creator: WebsocketValueCreator<Args, ReturnType>
): ResourceCacheManager<WebsocketDerivedValue<ReturnType>, Args & { wsUrl: string }> {
  return new ResourceCacheManager({
    constructor: (allArgs: Args & { wsUrl: string }) =>
      creator(IndexerWebsocketManager.use(allArgs.wsUrl), allArgs),

    destroyer: (instance, { wsUrl }) => {
      instance.teardown();
      IndexerWebsocketManager.markDone(wsUrl);
    },

    // take care - extra properties on the key will cause divergent behavior
    //     (cache misses, unexpected new object creation, marking incorrect objects as done, etc)
    // only ever pass the exact key type for correct behavior
    keySerializer: (allArgs) => stableStringify(allArgs),

    destroyDelayMs: DESTROY_DELAY_MS,
  });
}

export function subscribeToWsValue<Args, ReturnType>(
  manager: ResourceCacheManager<WebsocketDerivedValue<ReturnType>, Args & { wsUrl: string }>,
  args: NoInfer<Args> & { wsUrl: string },
  handleChange: (val: NoInfer<ReturnType>) => void
): () => void {
  const value = manager.use(args);
  const unsub = value.subscribe(handleChange);
  return () => {
    unsub();
    manager.markDone(args);
  };
}
