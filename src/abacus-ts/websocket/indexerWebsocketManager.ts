import { IndexerWebsocket } from './indexerWebsocket';

const cachedWebsockets: { [url: string]: IndexerWebsocket } = {};

function getIndexerWs(url: string) {
  if (cachedWebsockets[url] == null) {
    // eslint-disable-next-line no-console
    console.log('IndexerWsManager: spinning up @ ', url);
  }
  cachedWebsockets[url] ??= new IndexerWebsocket(url);
  return cachedWebsockets[url];
}

function destroyIndexerWs(url: string) {
  // eslint-disable-next-line no-console
  console.log('IndexerWsManager: tearing down @ ', url);

  cachedWebsockets[url]?.teardown();
  delete cachedWebsockets[url];
}

export const IndexerWebsocketManager = {
  get: getIndexerWs,
  teardown: destroyIndexerWs,
};
