import { HeightResponse } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { GroupingMultiplier } from '@/constants/orderbook';
import { AccountAuthenticator } from '@/constants/validators';
import {
  IndexerFundingPaymentResponseObject,
  IndexerHistoricalBlockTradingReward,
} from '@/types/indexer/indexerApiGen';
import { IndexerWsTradesUpdateObject } from '@/types/indexer/indexerManual';

import { type RootState } from '@/state/_store';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { SpotApiPortfolioTradesResponse, SpotApiTokenInfoObject } from '@/clients/spotApi';
import {
  SpotApiWsWalletBalanceObject,
  SpotApiWsWalletPositionObject,
  SpotApiWsWalletPositionsUpdate,
} from '@/lib/streaming/walletPositionsStreaming';
import { RecordValueType } from '@/lib/typeUtils';

import { HistoricalFundingObject } from './calculators/funding';
import { AdjustIsolatedMarginFormFns } from './forms/adjustIsolatedMargin';
import { SpotFormFns } from './forms/spot';
import { TradeFormFns } from './forms/trade/trade';
import { TransferFormFns } from './forms/transfers';
import { TriggerOrdersFormFns } from './forms/triggers/triggers';
import { Loadable, LoadableStatus } from './lib/loadable';
import { useCurrentMarketHistoricalFunding } from './rest/funding';
import { useFundingPayments } from './rest/fundingPayments';
import { SubaccountPnlTick, useParentSubaccountHistoricalPnls } from './rest/historicalPnl';
import { useAuthorizedAccounts } from './rest/permissionedKeys';
import {
  StakingDelegationsResult,
  StakingRewards,
  UnbondingDelegation,
  useStakingDelegations,
  useStakingRewards,
  useUnbondingDelegations,
} from './rest/staking';
import {
  getCurrentMarketAccountFills,
  selectAccountBlockRewardsLoading,
  selectAccountBlockTradingRewards,
  selectAccountFills,
  selectAccountFillsLoading,
  selectAccountOrders,
  selectAccountOrdersLoading,
  selectAccountStakingTier,
  selectAccountTransfers,
  selectAccountTransfersLoading,
  selectChildSubaccountSummaries,
  selectCurrentMarketBuyingPower,
  selectCurrentMarketInfoRaw,
  selectCurrentMarketOpenOrders,
  selectCurrentMarketOrderHistory,
  selectOpenOrders,
  selectOrderHistory,
  selectParentSubaccountOpenPositions,
  selectParentSubaccountOpenPositionsLoading,
  selectParentSubaccountSummary,
  selectParentSubaccountSummaryLoading,
  selectRelevantMarketsData,
  selectUnopenedIsolatedPositions,
} from './selectors/account';
import {
  selectParentSubaccountSummaryDeposit,
  selectParentSubaccountSummaryWithdrawal,
} from './selectors/accountActions';
import {
  selectApiState,
  selectLatestIndexerHeight,
  selectLatestValidatorHeight,
} from './selectors/apiStatus';
import {
  selectAllAssetsInfo,
  selectAllAssetsInfoLoading,
  selectAssetInfo,
  selectAssetLogo,
} from './selectors/assets';
import { selectAccountBalances, selectAccountNobleUsdcBalance } from './selectors/balances';
import {
  selectRawIndexerHeightDataLoading,
  selectRawMarketsData,
  selectRawParentSubaccountData,
  selectRawSelectedMarketLeveragesData,
  selectRawValidatorHeightDataLoading,
} from './selectors/base';
import { selectCompliance, selectComplianceLoading } from './selectors/compliance';
import { selectEquityTiers, selectFeeTiers, selectStakingTiers } from './selectors/configs';
import { selectCurrentMarketOrderbookLoading } from './selectors/markets';
import {
  selectCurrentMarketDepthChart,
  selectCurrentMarketMidPrice,
  selectCurrentMarketOrderbook,
} from './selectors/orderbook';
import { selectRewardsSummary } from './selectors/rewards';
import {
  selectSpotBalances,
  selectSpotPortfolioTrades,
  selectSpotPortfolioTradesLoading,
  selectSpotPositions,
  selectSpotSolPrice,
  selectSpotSolPriceLoading,
  selectSpotTokenMetadata,
  selectSpotTokenMetadataLoading,
  selectSpotTokenPrice,
  selectSpotTokenPriceLoading,
  selectSpotWalletPositions,
  selectSpotWalletPositionsLoading,
} from './selectors/spot';
import {
  selectAllMarketSummaries,
  selectAllMarketSummariesLoading,
  selectCurrentMarketAssetId,
  selectCurrentMarketAssetLogoUrl,
  selectCurrentMarketAssetName,
  selectCurrentMarketEffectiveSelectedLeverage,
  selectCurrentMarketInfo,
  selectCurrentMarketInfoStable,
  selectEffectiveSelectedMarketLeverage,
  selectMarketSummaryById,
  StablePerpetualMarketSummary,
} from './selectors/summary';
import { selectUserStats } from './selectors/userStats';
import { selectClientInitializationError } from './socketSelectors';
import { DepositUsdcProps, WithdrawUsdcProps } from './types/operationTypes';
import { DepthChartData, OrderbookProcessedData } from './types/orderbookTypes';
import { MarketsData, ParentSubaccountDataBase } from './types/rawTypes';
import {
  AccountBalances,
  AllAssetData,
  ApiState,
  AssetData,
  ChildSubaccountSummaries,
  Compliance,
  EquityTiersSummary,
  FeeTierSummary,
  GroupedSubaccountSummary,
  PendingIsolatedPosition,
  PerpetualMarketSummaries,
  PerpetualMarketSummary,
  RewardParamsSummary,
  StakingTiers,
  SubaccountFill,
  SubaccountOrder,
  SubaccountPosition,
  SubaccountTransfer,
  UserStakingTierSummary,
  UserStats,
} from './types/summaryTypes';
import { useCurrentMarketTradesValue } from './websocket/trades';

type BasicSelector<Result, Args extends any[] = []> = (state: RootState, ...args: Args) => Result;

// all data should be accessed via selectors in this file
// no files outside bonsai should access anything within bonsai except this file
interface BonsaiCoreShape {
  account: {
    parentSubaccountSummary: {
      data: BasicSelector<GroupedSubaccountSummary | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    parentSubaccountPositions: {
      data: BasicSelector<SubaccountPosition[] | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    childSubaccountSummaries: {
      data: BasicSelector<ChildSubaccountSummaries | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    openOrders: {
      data: BasicSelector<SubaccountOrder[]>;
      loading: BasicSelector<LoadableStatus>;
    };
    orderHistory: {
      data: BasicSelector<SubaccountOrder[]>;
      loading: BasicSelector<LoadableStatus>;
    };
    allOrders: {
      data: BasicSelector<SubaccountOrder[]>;
      loading: BasicSelector<LoadableStatus>;
    };
    fills: {
      data: BasicSelector<SubaccountFill[]>;
      loading: BasicSelector<LoadableStatus>;
    };
    transfers: {
      data: BasicSelector<SubaccountTransfer[]>;
      loading: BasicSelector<LoadableStatus>;
    };
    blockTradingRewards: {
      data: BasicSelector<IndexerHistoricalBlockTradingReward[]>;
      loading: BasicSelector<LoadableStatus>;
    };
    stats: {
      data: BasicSelector<UserStats>;
    };
    balances: {
      data: BasicSelector<AccountBalances>;
    };
    nobleUsdcBalance: {
      data: BasicSelector<string | undefined>;
    };
    stakingTier: {
      data: BasicSelector<UserStakingTierSummary | undefined>;
    };
  };
  markets: {
    currentMarketId: BasicSelector<string | undefined>;
    markets: {
      data: BasicSelector<PerpetualMarketSummaries | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    assets: {
      data: BasicSelector<AllAssetData | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
  };
  network: {
    indexerHeight: {
      data: BasicSelector<HeightResponse | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    validatorHeight: {
      data: BasicSelector<HeightResponse | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    apiState: BasicSelector<ApiState | undefined>;
    clientInitializationError: BasicSelector<boolean | undefined>;
  };
  configs: {
    feeTiers: BasicSelector<FeeTierSummary[] | undefined>;
    equityTiers: BasicSelector<EquityTiersSummary | undefined>;
    stakingTiers: BasicSelector<StakingTiers | undefined>;
  };
  compliance: { data: BasicSelector<Compliance>; loading: BasicSelector<LoadableStatus> };
  rewardParams: { data: BasicSelector<RewardParamsSummary> };
  spot: {
    solPrice: {
      data: BasicSelector<number | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    tokenPrice: {
      data: BasicSelector<number | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    tokenMetadata: {
      data: BasicSelector<SpotApiTokenInfoObject | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    walletPositions: {
      data: BasicSelector<SpotApiWsWalletPositionsUpdate | undefined>;
      loading: BasicSelector<LoadableStatus>;
      positions: BasicSelector<SpotApiWsWalletPositionObject[]>;
      tokenBalances: BasicSelector<SpotApiWsWalletBalanceObject[]>;
    };
    portfolioTrades: {
      data: BasicSelector<SpotApiPortfolioTradesResponse>;
      loading: BasicSelector<LoadableStatus>;
    };
  };
}

export const BonsaiCore: BonsaiCoreShape = {
  account: {
    parentSubaccountSummary: {
      data: selectParentSubaccountSummary,
      loading: selectParentSubaccountSummaryLoading,
    },
    parentSubaccountPositions: {
      data: selectParentSubaccountOpenPositions,
      loading: selectParentSubaccountOpenPositionsLoading,
    },
    childSubaccountSummaries: {
      data: selectChildSubaccountSummaries,
      loading: selectParentSubaccountSummaryLoading,
    },
    allOrders: {
      data: selectAccountOrders,
      loading: selectAccountOrdersLoading,
    },
    openOrders: {
      data: selectOpenOrders,
      loading: selectAccountOrdersLoading,
    },
    orderHistory: {
      data: selectOrderHistory,
      loading: selectAccountOrdersLoading,
    },
    fills: {
      data: selectAccountFills,
      loading: selectAccountFillsLoading,
    },
    transfers: {
      data: selectAccountTransfers,
      loading: selectAccountTransfersLoading,
    },
    blockTradingRewards: {
      data: selectAccountBlockTradingRewards,
      loading: selectAccountBlockRewardsLoading,
    },
    stats: {
      data: selectUserStats,
    },
    balances: {
      data: selectAccountBalances,
    },
    nobleUsdcBalance: {
      data: selectAccountNobleUsdcBalance,
    },
    stakingTier: {
      data: selectAccountStakingTier,
    },
  },
  markets: {
    currentMarketId: getCurrentMarketId,
    markets: {
      data: selectAllMarketSummaries,
      loading: selectAllMarketSummariesLoading,
    },
    assets: {
      data: selectAllAssetsInfo,
      loading: selectAllAssetsInfoLoading,
    },
  },
  network: {
    indexerHeight: {
      data: selectLatestIndexerHeight,
      loading: selectRawIndexerHeightDataLoading,
    },
    validatorHeight: {
      data: selectLatestValidatorHeight,
      loading: selectRawValidatorHeightDataLoading,
    },
    clientInitializationError: selectClientInitializationError,
    apiState: selectApiState,
  },
  configs: {
    equityTiers: selectEquityTiers,
    feeTiers: selectFeeTiers,
    stakingTiers: selectStakingTiers,
  },
  compliance: { data: selectCompliance, loading: selectComplianceLoading },
  rewardParams: { data: selectRewardsSummary },
  spot: {
    solPrice: {
      data: selectSpotSolPrice,
      loading: selectSpotSolPriceLoading,
    },
    tokenPrice: {
      data: selectSpotTokenPrice,
      loading: selectSpotTokenPriceLoading,
    },
    tokenMetadata: {
      data: selectSpotTokenMetadata,
      loading: selectSpotTokenMetadataLoading,
    },
    walletPositions: {
      data: selectSpotWalletPositions,
      loading: selectSpotWalletPositionsLoading,
      positions: selectSpotPositions,
      tokenBalances: selectSpotBalances,
    },
    portfolioTrades: {
      data: selectSpotPortfolioTrades,
      loading: selectSpotPortfolioTradesLoading,
    },
  },
};

interface BonsaiRawShape {
  parentSubaccountBase: BasicSelector<ParentSubaccountDataBase | undefined>;
  // DANGER: only the CURRENT relevant markets, so you cannot use if your operation might make MORE markets relevant
  // e.g. any place order
  parentSubaccountRelevantMarkets: BasicSelector<MarketsData | undefined>;
  selectedMarketLeverages: BasicSelector<{ [marketId: string]: number } | undefined>;
  currentMarket: BasicSelector<RecordValueType<MarketsData> | undefined>;
  // DANGER: updates a lot
  allMarkets: BasicSelector<MarketsData | undefined>;
}

export const BonsaiRaw: BonsaiRawShape = {
  parentSubaccountBase: selectRawParentSubaccountData,
  parentSubaccountRelevantMarkets: selectRelevantMarketsData,
  selectedMarketLeverages: selectRawSelectedMarketLeveragesData,
  currentMarket: selectCurrentMarketInfoRaw,
  allMarkets: selectRawMarketsData,
};

interface BonsaiHelpersShape {
  currentMarket: {
    marketInfo: BasicSelector<PerpetualMarketSummary | undefined>;
    // marketInfo but with only the properties that rarely change, for fewer rerenders
    stableMarketInfo: BasicSelector<StablePerpetualMarketSummary | undefined>;

    // direct helpers
    assetId: BasicSelector<string | undefined>;
    assetLogo: BasicSelector<string | undefined>;
    assetName: BasicSelector<string | undefined>;
    effectiveSelectedLeverage: BasicSelector<number>;

    account: {
      buyingPower: BasicSelector<BigNumber | undefined>;
      openOrders: BasicSelector<SubaccountOrder[]>;
      orderHistory: BasicSelector<SubaccountOrder[]>;
      fills: BasicSelector<SubaccountFill[]>;
    };
    orderbook: {
      selectGroupedData: BasicSelector<
        OrderbookProcessedData | undefined,
        [GroupingMultiplier | undefined]
      >;
      loading: BasicSelector<LoadableStatus>;
    };
    midPrice: {
      data: BasicSelector<BigNumber | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
    depthChart: {
      data: BasicSelector<DepthChartData | undefined>;
      loading: BasicSelector<LoadableStatus>;
    };
  };
  assets: {
    selectAssetInfo: BasicSelector<AssetData | undefined, [string | undefined]>;
    selectAssetLogo: BasicSelector<string | undefined, [string | undefined]>;
  };
  markets: {
    selectMarketSummaryById: BasicSelector<
      PerpetualMarketSummary | undefined,
      [string | undefined]
    >;
    selectEffectiveSelectedMarketLeverage: BasicSelector<number, [string | undefined]>;
  };
  forms: {
    deposit: {
      selectParentSubaccountSummary: BasicSelector<
        GroupedSubaccountSummary | undefined,
        [DepositUsdcProps]
      >;
    };
    withdraw: {
      selectParentSubaccountSummary: BasicSelector<
        GroupedSubaccountSummary | undefined,
        [WithdrawUsdcProps]
      >;
    };
  };
  unopenedIsolatedPositions: BasicSelector<PendingIsolatedPosition[] | undefined>;
}

export const BonsaiHelpers: BonsaiHelpersShape = {
  currentMarket: {
    marketInfo: selectCurrentMarketInfo,
    stableMarketInfo: selectCurrentMarketInfoStable,
    assetId: selectCurrentMarketAssetId,
    assetLogo: selectCurrentMarketAssetLogoUrl,
    assetName: selectCurrentMarketAssetName,
    effectiveSelectedLeverage: selectCurrentMarketEffectiveSelectedLeverage,
    orderbook: {
      selectGroupedData: selectCurrentMarketOrderbook,
      loading: selectCurrentMarketOrderbookLoading,
    },
    midPrice: {
      data: selectCurrentMarketMidPrice,
      loading: selectCurrentMarketOrderbookLoading,
    },
    depthChart: {
      data: selectCurrentMarketDepthChart,
      loading: selectCurrentMarketOrderbookLoading,
    },
    account: {
      buyingPower: selectCurrentMarketBuyingPower,
      openOrders: selectCurrentMarketOpenOrders,
      orderHistory: selectCurrentMarketOrderHistory,
      fills: getCurrentMarketAccountFills,
    },
  },
  assets: {
    // only use this for launchable assets, otherwise use market info
    selectAssetInfo,
    selectAssetLogo,
  },
  markets: {
    selectMarketSummaryById,
    selectEffectiveSelectedMarketLeverage,
  },
  forms: {
    deposit: {
      selectParentSubaccountSummary: selectParentSubaccountSummaryDeposit,
    },
    withdraw: {
      selectParentSubaccountSummary: selectParentSubaccountSummaryWithdrawal,
    },
  },
  unopenedIsolatedPositions: selectUnopenedIsolatedPositions,
};

interface BonsaiHooksShape {
  useAuthorizedAccounts: () => Loadable<AccountAuthenticator[]>;
  useCurrentMarketHistoricalFunding: () => Loadable<HistoricalFundingObject[]>;
  useCurrentMarketLiveTrades: () => Loadable<IndexerWsTradesUpdateObject>;
  useParentSubaccountHistoricalPnls: () => Loadable<SubaccountPnlTick[]>;
  useStakingRewards: () => Loadable<StakingRewards>;
  useUnbondingDelegations: () => Loadable<UnbondingDelegation[]>;
  useStakingDelegations: () => Loadable<StakingDelegationsResult>;
  useFundingPayments: () => Loadable<IndexerFundingPaymentResponseObject[]>;
}

export const BonsaiHooks: BonsaiHooksShape = {
  useAuthorizedAccounts,
  useCurrentMarketHistoricalFunding,
  useCurrentMarketLiveTrades: useCurrentMarketTradesValue,
  useFundingPayments,
  useParentSubaccountHistoricalPnls,
  useStakingRewards,
  useUnbondingDelegations,
  useStakingDelegations,
};

export const BonsaiForms = {
  TradeFormFns,
  TriggerOrdersFormFns,
  AdjustIsolatedMarginFormFns,
  TransferFormFns,
  SpotFormFns,
};
