import { IndexerWebsocket } from './indexerWebsocket';

const cachedWebsockets: {
  [url: string]: {
    ws: IndexerWebsocket;
    count: number;
    destroyTimeout?: NodeJS.Timeout | undefined;
  };
} = {};

function getIndexerWs(url: string) {
  if (cachedWebsockets[url] == null) {
    // eslint-disable-next-line no-console
    console.log('IndexerWsManager: spinning up @ ', url);
  }
  cachedWebsockets[url] ??= { ws: new IndexerWebsocket(url), count: 0 };
  cachedWebsockets[url].count += 1;
  clearTimeout(cachedWebsockets[url].destroyTimeout);
  return cachedWebsockets[url].ws;
}

function martkDoneUsingIndexerWs(url: string) {
  if (cachedWebsockets[url] == null) {
    // eslint-disable-next-line no-console
    console.log('IndexerWsManager: marking done non existent websocket ', url);
    return;
  }
  cachedWebsockets[url].count -= 1;

  // destroy after 1s with no users
  clearTimeout(cachedWebsockets[url].destroyTimeout);
  if (cachedWebsockets[url].count === 0) {
    cachedWebsockets[url].destroyTimeout = setTimeout(() => destroyIndexerWs(url), 1000);
  }
}

function destroyIndexerWs(url: string) {
  // eslint-disable-next-line no-console
  console.log('IndexerWsManager: tearing down @ ', url);

  cachedWebsockets[url]?.ws.teardown();
  delete cachedWebsockets[url];
}

export const IndexerWebsocketManager = {
  use: getIndexerWs,
  markDone: martkDoneUsingIndexerWs,
};
