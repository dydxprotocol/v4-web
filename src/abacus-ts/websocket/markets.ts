import {
  IndexerPerpetualMarketResponse,
  IndexerPerpetualMarketResponseObject,
} from '@/types/indexer/indexerApiGen';
import { IndexerWsMarketUpdateResponse } from '@/types/indexer/indexerManual';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { EndpointsConfig } from '@/hooks/useEndpointsConfig';

import { RootStore } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';

import { Loadable, loadableLoaded, loadablePending } from '../loadable';
import { IndexerWebsocket } from './indexerWebsocket';
import { IndexerWebsocketManager } from './indexerWebsocketManager';
import { SubscribableValue } from './subscribableValue';

type MarketsData = { [marketId: string]: IndexerPerpetualMarketResponseObject };

class MarketsTracker {
  private state = new SubscribableValue<Loadable<MarketsData>>(loadablePending());

  private unsub: (() => void) | undefined;

  constructor(private websocket: IndexerWebsocket) {
    this.unsub = this.websocket.addChannelSubscription({
      channel: 'v4_markets',
      id: undefined,
      handleBaseData: this._handleBase,
      handleUpdates: this._handleUpdates,
    });
  }

  public addSubscriber(handle: (val: Loadable<MarketsData>) => void): () => void {
    return this.state.addSubscriber(handle);
  }

  public teardown() {
    this.unsub?.();
    this.state.clearSubs();
    this.unsub = undefined;
  }

  private _handleBase = (baseMessage: any) => {
    const message = baseMessage as IndexerPerpetualMarketResponse;
    this.state.setValue(loadableLoaded(message.markets));
  };

  private _handleUpdates = (baseUpdates: any[]) => {
    const updates = baseUpdates as IndexerWsMarketUpdateResponse[];
    let startingValue = this.state.getValue().data;
    if (startingValue == null) {
      // eslint-disable-next-line no-console
      console.log('MarketsTracker found unexpectedly null base data in update');
      return;
    }
    startingValue = { ...startingValue };
    updates.forEach((update) => {
      if (update.oraclePrices != null) {
        Object.entries(update.oraclePrices).forEach(([marketId, oraclePriceObj]) => {
          if (startingValue[marketId] != null && oraclePriceObj.oraclePrice != null) {
            startingValue[marketId] = {
              ...startingValue[marketId],
              oraclePrice: oraclePriceObj.oraclePrice,
            };
          }
        });
      }
      if (update.trading != null) {
        Object.entries(update.trading).forEach(([marketId, updateObj]) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (startingValue[marketId] != null && updateObj != null) {
            startingValue[marketId] = {
              ...startingValue[marketId],
              ...updateObj,
            };
          }
        });
      }
    });
    this.state.setValue({ ...this.state.getValue(), data: startingValue });
  };
}

let lastTracker: MarketsTracker | undefined;
let lastUrl: string | undefined;

const selectWebsocketUrl = createAppSelector(getSelectedNetwork, (network) => {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return endpointsConfig.indexers[0]!.socket;
});

export function setUpMarkets(store: RootStore) {
  return store.subscribe(() => {
    const newUrl = selectWebsocketUrl(store.getState());
    if (newUrl !== lastUrl) {
      lastTracker?.teardown();
      // let the manager know we're not using it anymore either
      // but this is getting to be a lot of bookkeeping
      lastUrl = undefined;
      lastTracker = undefined;
    }
    lastUrl = newUrl;
    lastTracker = new MarketsTracker(IndexerWebsocketManager.get(newUrl));
    lastTracker.addSubscriber((val) => store.dispatch(SetRawMarkets(val)));
  });
}
