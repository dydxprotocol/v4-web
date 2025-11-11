import { createStoreEffect } from '@/bonsai/lib/createStoreEffect';
import { loadableIdle, loadableLoaded } from '@/bonsai/lib/loadable';

import { type RootStore } from '@/state/_store';
import { getUserSolanaWalletAddress } from '@/state/accountInfoSelectors';
import {
  getCurrentPath,
  getSpotApiEndpoint,
  getSpotCandleServiceEndpoint,
} from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setSpotCandles, setSpotWalletPositions } from '@/state/raw';
import { getCurrentSpotToken } from '@/state/spot';

import { SpotCandleServiceCandleObject } from '@/clients/spotCandleService';
import { subscribeToSpotCandles } from '@/lib/streaming/spotCandleStreaming';
import { subscribeToWalletPositions } from '@/lib/streaming/walletPositionsStreaming';

const SPOT_CANDLE_INTERVAL = '5';
const MAX_CANDLES = 20;

const getSpotCandleSubscriptionParams = createAppSelector(
  [getCurrentPath, getSpotCandleServiceEndpoint, getCurrentSpotToken],
  (currentPath, spotCandleServiceEndpoint, currentSpotToken) => {
    if (!currentPath.startsWith('/spot') || !currentSpotToken || !spotCandleServiceEndpoint) {
      return null;
    }

    return { endpoint: spotCandleServiceEndpoint, token: currentSpotToken };
  }
);

// Not used as there is no need and the candle service is unreliable, setUpSpotTokenPriceQuery does the same job for now
export function setUpSpotCandles(store: RootStore) {
  return createStoreEffect(store, getSpotCandleSubscriptionParams, (params) => {
    if (!params) {
      store.dispatch(setSpotCandles(loadableIdle()));
      return () => {};
    }

    const { endpoint, token } = params;

    const candles: SpotCandleServiceCandleObject[] = [];

    const unsubscribe = subscribeToSpotCandles(
      endpoint,
      token,
      SPOT_CANDLE_INTERVAL,
      (candle: SpotCandleServiceCandleObject) => {
        const existingIndex = candles.findIndex((c) => c.t === candle.t);
        if (existingIndex !== -1) {
          candles[existingIndex] = candle;
        } else {
          candles.push(candle);
          if (candles.length > MAX_CANDLES) {
            candles.shift();
          }
        }

        candles.sort((a, b) => a.t - b.t);
        store.dispatch(setSpotCandles(loadableLoaded([...candles])));
      }
    );

    return () => {
      unsubscribe();
      store.dispatch(setSpotCandles(loadableIdle()));
    };
  });
}

const getWalletPositionsSubscriptionParams = createAppSelector(
  [getSpotApiEndpoint, getUserSolanaWalletAddress],
  (spotApiEndpoint, solanaWalletAddress) => {
    if (!spotApiEndpoint || !solanaWalletAddress) {
      return null;
    }

    return { endpoint: spotApiEndpoint, walletAddress: solanaWalletAddress };
  }
);

export function setUpSpotWalletPositions(store: RootStore) {
  return createStoreEffect(store, getWalletPositionsSubscriptionParams, (params) => {
    if (!params) {
      store.dispatch(setSpotWalletPositions(loadableIdle()));
      return () => {};
    }

    const { endpoint, walletAddress } = params;

    const unsubscribe = subscribeToWalletPositions(endpoint, walletAddress, (data) => {
      store.dispatch(setSpotWalletPositions(loadableLoaded(data)));
    });

    return () => {
      unsubscribe();
      store.dispatch(setSpotWalletPositions(loadableIdle()));
    };
  });
}
