import { QueryObserver } from '@tanstack/react-query';

import { AppRoute } from '@/constants/routes';
import { timeUnits } from '@/constants/time';
import { SOL_MINT_ADDRESS } from '@/constants/tokens';

import { type RootStore } from '@/state/_store';
import { getUserSolanaWalletAddress } from '@/state/accountInfoSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { getCurrentPath, getSpotApiEndpoint } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import {
  setSpotPortfolioTrades,
  setSpotSolPrice,
  setSpotTokenMetadata,
  setSpotTokenPrice,
} from '@/state/raw';
import { getCurrentSpotToken } from '@/state/spot';

import {
  getSpotPortfolioTrades,
  getSpotTokenMetadata,
  getSpotTokenUsdPrice,
} from '@/clients/spotApi';

import { createStoreEffect } from '../lib/createStoreEffect';
import { loadableIdle } from '../lib/loadable';
import { logBonsaiError, wrapAndLogBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { safeSubscribeObserver } from './lib/safeSubscribe';

const getSpotApiEndpointWhenOnSpotPage = createAppSelector(
  [getCurrentPath, getSpotApiEndpoint, getCurrentSpotToken],
  (currentPath, spotApiEndpoint, currentSpotToken) => {
    if (!currentPath.startsWith(AppRoute.Spot) || !currentSpotToken) {
      return null;
    }
    return { endpoint: spotApiEndpoint, currentSpotToken };
  }
);

export function setUpTokenMetadataQuery(store: RootStore) {
  return createStoreEffect(store, getSpotApiEndpointWhenOnSpotPage, (params) => {
    if (!params) {
      store.dispatch(setSpotTokenMetadata(loadableIdle()));
      return () => {};
    }

    const { endpoint, currentSpotToken } = params;

    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['spot', 'tokenMetadata', currentSpotToken],
      queryFn: wrapAndLogBonsaiError(
        () => getSpotTokenMetadata(endpoint, currentSpotToken),
        'tokenMetadata'
      ),
      refetchInterval: timeUnits.minute * 5,
      staleTime: timeUnits.minute * 5,
      retryDelay: (attempt) => timeUnits.second * 3 * 2 ** attempt,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(setSpotTokenMetadata(queryResultToLoadable(result)));
      } catch (e) {
        logBonsaiError(
          'setUpTokenMetadataQuery',
          'Error handling result from react query',
          e,
          result
        );
      }
    });

    return () => {
      store.dispatch(setSpotTokenMetadata(loadableIdle()));
      unsubscribe();
    };
  });
}

export function setUpSolPriceQuery(store: RootStore) {
  return createStoreEffect(store, getSpotApiEndpointWhenOnSpotPage, (params) => {
    if (!params) {
      store.dispatch(setSpotSolPrice(loadableIdle()));
      return () => {};
    }

    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['spotTokenPrice', SOL_MINT_ADDRESS],
      queryFn: wrapAndLogBonsaiError(
        () => getSpotTokenUsdPrice(params.endpoint, SOL_MINT_ADDRESS),
        'solPrice'
      ),
      refetchInterval: timeUnits.second * 10,
      staleTime: timeUnits.second * 10,
      retry: true,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(setSpotSolPrice(queryResultToLoadable(result)));
      } catch (e) {
        logBonsaiError('setUpSolPriceQuery', 'Error handling result from react query', e, result);
      }
    });

    return () => {
      store.dispatch(setSpotSolPrice(loadableIdle()));
      unsubscribe();
    };
  });
}

export function setUpSpotTokenPriceQuery(store: RootStore) {
  return createStoreEffect(store, getSpotApiEndpointWhenOnSpotPage, (params) => {
    if (!params) {
      store.dispatch(setSpotTokenPrice(loadableIdle()));
      return () => {};
    }

    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['spotTokenPrice', params.currentSpotToken],
      queryFn: wrapAndLogBonsaiError(
        () => getSpotTokenUsdPrice(params.endpoint, params.currentSpotToken),
        'tokenPrice'
      ),
      refetchInterval: timeUnits.second * 10,
      staleTime: timeUnits.second * 10,
      retry: true,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(setSpotTokenPrice(queryResultToLoadable(result)));
      } catch (e) {
        logBonsaiError(
          'setUpSpotTokenPriceQuery',
          'Error handling result from react query',
          e,
          result
        );
      }
    });

    return () => {
      store.dispatch(setSpotTokenPrice(loadableIdle()));
      unsubscribe();
    };
  });
}

const getPortfolioTradesParams = createAppSelector(
  [getCurrentPath, getSpotApiEndpoint, getUserSolanaWalletAddress],
  (currentPath, spotApiEndpoint, walletAddress) => {
    if (!currentPath.startsWith(AppRoute.Spot) || !walletAddress) {
      return null;
    }
    return { endpoint: spotApiEndpoint, walletAddress };
  }
);

export function setUpPortfolioTradesQuery(store: RootStore) {
  return createStoreEffect(store, getPortfolioTradesParams, (params) => {
    if (!params) {
      store.dispatch(setSpotPortfolioTrades(loadableIdle()));
      return () => {};
    }

    const { endpoint, walletAddress } = params;

    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['spot', 'portfolioTrades', walletAddress],
      queryFn: wrapAndLogBonsaiError(
        () => getSpotPortfolioTrades(endpoint, walletAddress),
        'portfolioTrades'
      ),
      refetchInterval: timeUnits.minute * 2,
      staleTime: timeUnits.minute * 2,
      retryDelay: (attempt) => timeUnits.second * 3 * 2 ** attempt,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(setSpotPortfolioTrades(queryResultToLoadable(result)));
      } catch (e) {
        logBonsaiError(
          'setUpPortfolioTradesQuery',
          'Error handling result from react query',
          e,
          result
        );
      }
    });

    return () => {
      store.dispatch(setSpotPortfolioTrades(loadableIdle()));
      unsubscribe();
    };
  });
}
