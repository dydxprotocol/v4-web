import { Loadable, LoadableError, loadableIdle, LoadableSuccess } from '@/bonsai/lib/loadable';
// eslint-disable-next-line no-restricted-imports
import {
  AssetInfos,
  MarketsData,
  OrderbookData,
  OrdersData,
  ParentSubaccountData,
} from '@/bonsai/types/rawTypes';
import {
  AccountStats,
  ComplianceResponse,
  ConfigTiers,
  GeoState,
  PerpetualMarketFeeDiscount,
  RewardsParams,
  TokenPriceResponse,
  UserFeeTier,
  UserStakingTier,
} from '@/bonsai/types/summaryTypes';
import { Coin } from '@cosmjs/proto-signing';
import { HeightResponse } from '@dydxprotocol/v4-client-js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WritableDraft } from 'immer';

import { DydxNetwork } from '@/constants/networks';
import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerParentSubaccountTransferResponse,
} from '@/types/indexer/indexerApiGen';
import {
  IndexerCompositeFillResponse,
  IndexerSparklineResponseObject,
} from '@/types/indexer/indexerManual';

import {
  SpotApiPortfolioTradesResponse,
  SpotApiTokenMetadataResponse,
  SpotApiTokenPriceResponse,
} from '@/clients/spotApi';
import { calc } from '@/lib/do';
import { SpotApiWsWalletPositionsUpdate } from '@/lib/streaming/walletPositionsStreaming';

import { autoBatchAllReducers } from './autoBatchHelpers';

interface NetworkState {
  indexerClientReady: boolean;
  compositeClientReady: boolean;
  compositeClientUrl: string | undefined;
  nobleClientReady: boolean;
  errorInitializing: boolean;
}

export type HeightEntry = {
  requestTime: string;
  receivedTime: string;
  // always undefined if Loadable is error
  response: HeightResponse | undefined;
};

export type HeightState = {
  latest: Loadable<HeightEntry>;
  // latest in front, will contain latest IFF latest is successful or error
  lastFewResults: Array<LoadableSuccess<HeightEntry> | LoadableError<HeightEntry>>;
};

export type ComplianceErrors = {
  errors?: any[];
};

export type ComplianceState = {
  geo: Loadable<GeoState | undefined>;
  sourceAddressScreenV2: Loadable<ComplianceResponse & ComplianceErrors>;
  localAddressScreenV2: Loadable<ComplianceResponse & ComplianceErrors>;
};

export interface RawDataState {
  markets: {
    allMarkets: Loadable<MarketsData>;
    feeDiscounts: Loadable<PerpetualMarketFeeDiscount | undefined>;
    assets: Loadable<AssetInfos>;
    orderbooks: { [marketId: string]: Loadable<OrderbookData> };
    sparklines: Loadable<{
      [period: string]: IndexerSparklineResponseObject | undefined;
    }>;
    selectedMarketLeverages: Loadable<{ [marketId: string]: number }>;
  };
  account: {
    balances: Loadable<Coin[]>;
    nobleUsdcBalance: Loadable<Coin>;
    stats: Loadable<AccountStats | undefined>;
    feeTier: Loadable<UserFeeTier | undefined>;
    stakingTier: Loadable<UserStakingTier | undefined>;
    parentSubaccount: Loadable<ParentSubaccountData>;
    fills: Loadable<IndexerCompositeFillResponse>;
    orders: Loadable<OrdersData>;
    transfers: Loadable<IndexerParentSubaccountTransferResponse>;
    blockTradingRewards: Loadable<IndexerHistoricalBlockTradingRewardsResponse>;
  };
  network: {
    [networkId: string]: NetworkState;
  };
  heights: {
    indexerHeight: HeightState;
    validatorHeight: HeightState;
  };
  configs: Loadable<ConfigTiers>;
  compliance: ComplianceState;
  rewards: {
    data: Loadable<RewardsParams | undefined>;
    price: Loadable<TokenPriceResponse | undefined>;
  };
  spot: {
    solPrice: Loadable<SpotApiTokenPriceResponse | undefined>;
    tokenPrice: Loadable<SpotApiTokenPriceResponse | undefined>;
    tokenMetadata: Loadable<SpotApiTokenMetadataResponse | undefined>;
    walletPositions: Loadable<SpotApiWsWalletPositionsUpdate | undefined>;
    portfolioTrades: Loadable<SpotApiPortfolioTradesResponse | undefined>;
  };
}

const initialState: RawDataState = {
  markets: {
    allMarkets: loadableIdle(),
    feeDiscounts: loadableIdle(),
    assets: loadableIdle(),
    orderbooks: {},
    sparklines: loadableIdle(),
    // TODO: this should actually be idle eventually, not success with empty data
    selectedMarketLeverages: { status: 'success', data: {} },
  },
  account: {
    parentSubaccount: loadableIdle(),
    balances: loadableIdle(),
    nobleUsdcBalance: loadableIdle(),
    stats: loadableIdle(),
    feeTier: loadableIdle(),
    stakingTier: loadableIdle(),
    fills: loadableIdle(),
    orders: loadableIdle(),
    transfers: loadableIdle(),
    blockTradingRewards: loadableIdle(),
  },
  network: {},
  heights: {
    indexerHeight: { lastFewResults: [], latest: loadableIdle() },
    validatorHeight: { lastFewResults: [], latest: loadableIdle() },
  },
  configs: loadableIdle(),
  compliance: {
    geo: loadableIdle(),
    localAddressScreenV2: loadableIdle(),
    sourceAddressScreenV2: loadableIdle(),
  },
  rewards: {
    data: loadableIdle(),
    price: loadableIdle(),
  },
  spot: {
    solPrice: loadableIdle(),
    tokenMetadata: loadableIdle(),
    tokenPrice: loadableIdle(),
    walletPositions: loadableIdle(),
    portfolioTrades: loadableIdle(),
  },
};

export const rawSlice = createSlice({
  name: 'Raw data',
  initialState,
  reducers: {
    ...autoBatchAllReducers<RawDataState>()({
      setAllAssetsRaw: (state, action: PayloadAction<Loadable<AssetInfos>>) => {
        state.markets.assets = action.payload;
      },
      setSparklines: (
        state,
        action: PayloadAction<
          Loadable<{
            [period: string]: IndexerSparklineResponseObject | undefined;
          }>
        >
      ) => {
        state.markets.sparklines = action.payload;
      },
      setParentSubaccountRaw: (state, action: PayloadAction<Loadable<ParentSubaccountData>>) => {
        state.account.parentSubaccount = action.payload;
      },
      setAccountBalancesRaw: (state, action: PayloadAction<Loadable<Coin[]>>) => {
        state.account.balances = action.payload;
      },
      setAccountNobleUsdcBalanceRaw: (state, action: PayloadAction<Loadable<Coin>>) => {
        state.account.nobleUsdcBalance = action.payload;
      },
      setAccountStatsRaw: (state, action: PayloadAction<Loadable<AccountStats | undefined>>) => {
        state.account.stats = action.payload;
      },
      setAccountFeeTierRaw: (state, action: PayloadAction<Loadable<UserFeeTier | undefined>>) => {
        state.account.feeTier = action.payload;
      },
      setAccountStakingTierRaw: (
        state,
        action: PayloadAction<Loadable<UserStakingTier | undefined>>
      ) => {
        state.account.stakingTier = action.payload;
      },
      setConfigTiers: (state, action: PayloadAction<Loadable<ConfigTiers>>) => {
        state.configs = action.payload;
      },
      setAccountFillsRaw: (
        state,
        action: PayloadAction<Loadable<IndexerCompositeFillResponse>>
      ) => {
        state.account.fills = action.payload;
      },
      setAccountTransfersRaw: (
        state,
        action: PayloadAction<Loadable<IndexerParentSubaccountTransferResponse>>
      ) => {
        state.account.transfers = action.payload;
      },
      setAccountBlockTradingRewardsRaw: (
        state,
        action: PayloadAction<Loadable<IndexerHistoricalBlockTradingRewardsResponse>>
      ) => {
        state.account.blockTradingRewards = action.payload;
      },
      setAccountOrdersRaw: (state, action: PayloadAction<Loadable<OrdersData>>) => {
        state.account.orders = action.payload;
      },
      setIndexerHeightRaw: (state, action: PayloadAction<Loadable<HeightEntry>>) => {
        appendToHeight(state.heights.indexerHeight, action.payload);
      },
      setValidatorHeightRaw: (state, action: PayloadAction<Loadable<HeightEntry>>) => {
        appendToHeight(state.heights.validatorHeight, action.payload);
      },
      setComplianceGeoRaw: (state, action: PayloadAction<Loadable<GeoState | undefined>>) => {
        state.compliance.geo = action.payload;
      },
      setLocalAddressScreenV2Raw: (
        state,
        action: PayloadAction<Loadable<ComplianceResponse & ComplianceErrors>>
      ) => {
        state.compliance.localAddressScreenV2 = action.payload;
      },
      setSourceAddressScreenV2Raw: (
        state,
        action: PayloadAction<Loadable<ComplianceResponse & ComplianceErrors>>
      ) => {
        state.compliance.sourceAddressScreenV2 = action.payload;
      },
      setRewardsParams: (state, action: PayloadAction<Loadable<RewardsParams | undefined>>) => {
        state.rewards.data = action.payload;
      },
      setRewardsTokenPrice: (
        state,
        action: PayloadAction<Loadable<TokenPriceResponse | undefined>>
      ) => {
        state.rewards.price = action.payload;
      },
      setSelectedMarketLeverage: (
        state,
        action: PayloadAction<{ marketId: string; leverage: number }>
      ) => {
        const { marketId, leverage } = action.payload;
        if (state.markets.selectedMarketLeverages.status === 'success') {
          state.markets.selectedMarketLeverages.data[marketId] = leverage;
        }
      },
      setSelectedMarketLeverages: (
        state,
        action: PayloadAction<Loadable<{ [marketId: string]: number }>>
      ) => {
        state.markets.selectedMarketLeverages = action.payload;
      },
      setSpotSolPrice: (
        state,
        action: PayloadAction<Loadable<SpotApiTokenPriceResponse | undefined>>
      ) => {
        state.spot.solPrice = action.payload;
      },
      setSpotTokenPrice: (
        state,
        action: PayloadAction<Loadable<SpotApiTokenPriceResponse | undefined>>
      ) => {
        state.spot.tokenPrice = action.payload;
      },
      setSpotTokenMetadata: (
        state,
        action: PayloadAction<Loadable<SpotApiTokenMetadataResponse | undefined>>
      ) => {
        state.spot.tokenMetadata = action.payload;
      },
      setSpotWalletPositions: (
        state,
        action: PayloadAction<Loadable<SpotApiWsWalletPositionsUpdate | undefined>>
      ) => {
        state.spot.walletPositions = action.payload;
      },
      setSpotPortfolioTrades: (
        state,
        action: PayloadAction<Loadable<SpotApiPortfolioTradesResponse | undefined>>
      ) => {
        state.spot.portfolioTrades = action.payload;
      },
    }),
    // orderbook is throttled separately for fine-grained control
    setOrderbookRaw: (
      state,
      action: PayloadAction<{ marketId: string; data: Loadable<OrderbookData> }>
    ) => {
      state.markets.orderbooks[action.payload.marketId] = action.payload.data;
    },
    setAllMarketsRaw: (state, action: PayloadAction<Loadable<MarketsData>>) => {
      state.markets.allMarkets = action.payload;
    },
    setNetworkStateRaw: (
      state,
      action: PayloadAction<{ networkId: DydxNetwork; stateToMerge: Partial<NetworkState> }>
    ) => {
      const { networkId, stateToMerge } = action.payload;
      state.network[networkId] = {
        ...(state.network[networkId] ?? {
          compositeClientReady: false,
          compositeClientUrl: undefined,
          indexerClientReady: false,
          nobleClientReady: false,
          errorInitializing: false,
        }),
        ...stateToMerge,
      };
    },
    setMarketsFeeDiscountsRaw: (
      state,
      action: PayloadAction<Loadable<PerpetualMarketFeeDiscount | undefined>>
    ) => {
      state.markets.feeDiscounts = action.payload;
    },
  },
});

const HEIGHTS_BUFFER_LENGTH = 12;

function appendToHeight(height: WritableDraft<HeightState>, response: Loadable<HeightEntry>) {
  height.latest = response;

  // only want to append results with a different request time
  // we can get duplicates because of how the react query lifecycle works
  const matchesMostRecentSaved = calc(() => {
    const latest = height.lastFewResults[0];
    return (
      latest?.data?.requestTime != null && latest.data.requestTime === response.data?.requestTime
    );
  });
  if (matchesMostRecentSaved) {
    return;
  }
  if (response.status === 'error' || response.status === 'success') {
    height.lastFewResults.unshift(response);
  }
  if (height.lastFewResults.length > HEIGHTS_BUFFER_LENGTH) {
    height.lastFewResults.pop();
  }
}

export const {
  setOrderbookRaw,
  setAllMarketsRaw,
  setAllAssetsRaw,
  setSparklines,
  setParentSubaccountRaw,
  setAccountBalancesRaw,
  setAccountStatsRaw,
  setAccountFillsRaw,
  setAccountNobleUsdcBalanceRaw,
  setAccountOrdersRaw,
  setAccountTransfersRaw,
  setAccountBlockTradingRewardsRaw,
  setNetworkStateRaw,
  setIndexerHeightRaw,
  setValidatorHeightRaw,
  setAccountFeeTierRaw,
  setAccountStakingTierRaw,
  setMarketsFeeDiscountsRaw,
  setConfigTiers,
  setComplianceGeoRaw,
  setLocalAddressScreenV2Raw,
  setSourceAddressScreenV2Raw,
  setRewardsParams,
  setRewardsTokenPrice,
  setSelectedMarketLeverage,
  setSelectedMarketLeverages,
  setSpotSolPrice,
  setSpotTokenPrice,
  setSpotTokenMetadata,
  setSpotWalletPositions,
  setSpotPortfolioTrades,
} = rawSlice.actions;
