import { useEffect, useMemo } from 'react';

import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
// eslint-disable-next-line no-restricted-imports
import { useIndexerClient } from '@/bonsai/rest/lib/useIndexer';
import { useQuery } from '@tanstack/react-query';
import { shallowEqual } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';

import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID, MarketFilters } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';
import { IndexerPerpetualMarketStatus } from '@/types/indexer/indexerApiGen';

import { useLaunchableMarkets } from '@/hooks/useLaunchableMarkets';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import { store } from '@/state/_store';
import { getOpenPositions } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialogInTradeBox, openDialog } from '@/state/dialogs';
import { getActiveTradeBoxDialog } from '@/state/dialogsSelectors';
import { getHasSeenPredictionMarketIntroDialog } from '@/state/dismissableSelectors';
import { setCurrentMarketId, setCurrentMarketIdIfTradeable } from '@/state/perpetuals';
import { getLaunchedMarketIds, getMarketIds } from '@/state/perpetualsSelectors';

import { useMarketsData } from './useMarketsData';
import { useAppSelectorWithArgs } from './useParameterizedSelector';

// conservative, fast way to tell if a market is real and open for trading
// using because v4_markets takes 1.1s and this is only .3s
const useIsMarketValidFast = (market: string | undefined) => {
  const indexer = useIndexerClient();
  const { data } = useQuery({
    queryKey: ['indexer', 'market', market, indexer.key],
    queryFn: async (): Promise<boolean> => {
      if (market == null) {
        return false;
      }
      const all = BonsaiCore.markets.markets.data(store.getState());
      if (all != null) {
        return all[market]?.oraclePrice != null;
      }
      const loaded = (await indexer.indexerClient?.markets.getPerpetualMarkets(market))?.markets[
        market
      ];
      return loaded?.oraclePrice != null && loaded.status === IndexerPerpetualMarketStatus.ACTIVE;
    },
  });
  return data;
};

export const useCurrentMarketId = () => {
  const navigate = useNavigate();
  const match = useMatch(`/${AppRoute.Trade}/:marketId`);
  const { marketId } = match?.params ?? {};
  const dispatch = useAppDispatch();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const openPositions = useAppSelector(getOpenPositions, shallowEqual);
  const marketIds = useAppSelector(getMarketIds, shallowEqual);
  const isValidMarketFast = useIsMarketValidFast(marketId);
  const hasMarketIds = marketIds.length > 0;
  const currentMarketOraclePrice = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    marketId
  )?.oraclePrice;
  const hasMarketOraclePrice = currentMarketOraclePrice != null;
  const launchableMarkets = useLaunchableMarkets();
  const activeTradeBoxDialog = useAppSelector(getActiveTradeBoxDialog);
  const hasLoadedLaunchableMarkets = launchableMarkets.data.length > 0;
  const hasSeenPredictionMarketIntroDialog = useAppSelector(getHasSeenPredictionMarketIntroDialog);
  const launchedMarketIds = useAppSelector(getLaunchedMarketIds);

  const { filteredMarkets: predictionMarkets } = useMarketsData({
    filter: MarketFilters.PREDICTION_MARKET,
    forceHideUnlaunchedMarkets: true,
  });

  const [lastViewedMarket, setLastViewedMarket] = useLocalStorage({
    key: LocalStorageKey.LastViewedMarket,
    defaultValue: DEFAULT_MARKETID,
  });

  const onNavigateToPredictionMarket = () => {
    if (!hasSeenPredictionMarketIntroDialog) {
      dispatch(openDialog(DialogTypes.PredictionMarketIntro()));
    }
  };

  const validId = useMemo(() => {
    if (marketIds.length === 0) return marketId ?? lastViewedMarket;
    if (!marketIds.includes(marketId ?? lastViewedMarket)) return DEFAULT_MARKETID;
    return marketId ?? lastViewedMarket;
  }, [hasMarketIds, marketId]);

  const isViewingUnlaunchedMarket = useMemo(() => {
    if (!hasMarketIds || !hasLoadedLaunchableMarkets) return false;

    // Continue displaying unlaunched market view if marketId is in launchedMarketIds state
    if (marketId && launchedMarketIds.includes(marketId)) {
      return true;
    }

    return launchableMarkets.data.some((market) => {
      return market.id === marketId;
    });
  }, [
    hasLoadedLaunchableMarkets,
    hasMarketIds,
    launchedMarketIds,
    launchableMarkets.data,
    marketId,
  ]);

  const isViewingPredictionMarket = useMemo(() => {
    return predictionMarkets.some((market) => market.id === marketId);
  }, [predictionMarkets.length, marketId]);

  useEffect(() => {
    // If v4_markets has not been subscribed to yet or marketId is not specified, default to validId
    if (!marketId) {
      setLastViewedMarket(validId);
      dispatch(setCurrentMarketId(validId));
      dispatch(closeDialogInTradeBox());

      if (validId !== marketId) {
        navigate(`${AppRoute.Trade}/${validId}`, {
          replace: true,
        });
      }
    } else {
      // If v4_markets has been subscribed to, check if marketId is valid
      if (
        hasMarketIds &&
        !marketIds.includes(marketId) &&
        !isViewingUnlaunchedMarket &&
        hasLoadedLaunchableMarkets
      ) {
        // If marketId is not valid (i.e. final settlement), navigate to markets page
        navigate(AppRoute.Markets, {
          replace: true,
        });
      } else {
        // If marketId is valid, set currentMarketId
        setLastViewedMarket(marketId);
        dispatch(setCurrentMarketId(marketId));

        // If changed to a prediction market, display Prediction Market explainer
        if (isViewingPredictionMarket) {
          onNavigateToPredictionMarket();
        }

        if (
          activeTradeBoxDialog != null &&
          TradeBoxDialogTypes.is.ClosePosition(activeTradeBoxDialog) &&
          openPositions?.find((position) => position.market === marketId)
        ) {
          // Keep the close positions dialog open between market changes as long as there exists an open position
          return;
        }

        dispatch(closeDialogInTradeBox());
      }
    }
  }, [hasMarketIds, hasLoadedLaunchableMarkets, isViewingUnlaunchedMarket, marketId, navigate]);

  useEffect(() => {
    if (isViewingUnlaunchedMarket) {
      dispatch(setCurrentMarketIdIfTradeable(undefined));
    } else {
      if (marketId) {
        const isMarketReadyForSubscription = hasMarketOraclePrice || isValidMarketFast;
        if (isMarketReadyForSubscription) {
          dispatch(setCurrentMarketIdIfTradeable(marketId));
        }
      } else {
        dispatch(setCurrentMarketIdIfTradeable(undefined));
      }
    }
  }, [
    isViewingUnlaunchedMarket,
    selectedNetwork,
    hasMarketOraclePrice,
    marketId,
    dispatch,
    isValidMarketFast,
  ]);

  return {
    isViewingUnlaunchedMarket,
    hasLoadedMarkets: hasLoadedLaunchableMarkets && hasMarketIds,
  };
};
