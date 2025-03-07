import { HeightResponse } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { GroupingMultiplier } from '@/constants/orderbook';
import { IndexerHistoricalTradingRewardAggregation } from '@/types/indexer/indexerApiGen';
import { IndexerWsTradesUpdateObject } from '@/types/indexer/indexerManual';

import { type RootState } from '@/state/_store';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { HistoricalFundingObject } from './calculators/funding';
import { Loadable, LoadableStatus } from './lib/loadable';
import { useCurrentMarketHistoricalFunding } from './rest/funding';
import { SubaccountPnlTick, useParentSubaccountHistoricalPnls } from './rest/historicalPnl';
import {
  useDailyCumulativeTradingRewards,
  useHistoricalTradingRewards,
  useHistoricalTradingRewardsWeekly,
  useTotalTradingRewards,
} from './rest/historicalTradingRewards';
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
  selectAccountFills,
  selectAccountFillsLoading,
  selectAccountOrders,
  selectAccountOrdersLoading,
  selectAccountTransfers,
  selectAccountTransfersLoading,
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
  createSelectParentSubaccountSummaryDeposit,
  createSelectParentSubaccountSummaryWithdrawal,
} from './selectors/accountActions';
import {
  selectApiState,
  selectLatestIndexerHeight,
  selectLatestValidatorHeight,
} from './selectors/apiStatus';
import {
  createSelectAssetInfo,
  createSelectAssetLogo,
  selectAllAssetsInfo,
  selectAllAssetsInfoLoading,
} from './selectors/assets';
import { selectAccountBalances, selectAccountNobleUsdcBalance } from './selectors/balances';
import {
  selectRawIndexerHeightDataLoading,
  selectRawMarketsData,
  selectRawParentSubaccountData,
  selectRawValidatorHeightDataLoading,
} from './selectors/base';
import { selectCompliance, selectComplianceLoading } from './selectors/compliance';
import { selectEquityTiers, selectFeeTiers } from './selectors/configs';
import { selectCurrentMarketOrderbookLoading } from './selectors/markets';
import {
  createSelectCurrentMarketOrderbook,
  selectCurrentMarketDepthChart,
  selectCurrentMarketMidPrice,
} from './selectors/orderbook';
import {
  createSelectMarketSummaryById,
  selectAllMarketSummaries,
  selectAllMarketSummariesLoading,
  selectCurrentMarketAssetId,
  selectCurrentMarketAssetLogoUrl,
  selectCurrentMarketAssetName,
  selectCurrentMarketInfo,
  selectCurrentMarketInfoStable,
  StablePerpetualMarketSummary,
} from './selectors/summary';
import { selectUserStats } from './selectors/userStats';
import { DepositUsdcProps, WithdrawUsdcProps } from './types/operationTypes';
import { DepthChartData, OrderbookProcessedData } from './types/orderbookTypes';
import { MarketsData, ParentSubaccountDataBase } from './types/rawTypes';
import {
  AccountBalances,
  AggregatedTradingReward,
  AllAssetData,
  ApiState,
  AssetData,
  Compliance,
  EquityTiersSummary,
  FeeTierSummary,
  GroupedSubaccountSummary,
  PendingIsolatedPosition,
  PerpetualMarketSummaries,
  PerpetualMarketSummary,
  SubaccountFill,
  SubaccountOrder,
  SubaccountPosition,
  SubaccountTransfer,
  UserStats,
} from './types/summaryTypes';
import { useCurrentMarketTradesValue } from './websocket/trades';

type BasicSelector<Result> = (state: RootState) => Result;
type ParameterizedSelector<Result, Args extends any[]> = () => (
  state: RootState,
  ...args: Args
) => Result;

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
    stats: {
      data: BasicSelector<UserStats>;
    };
    balances: {
      data: BasicSelector<AccountBalances>;
    };
    nobleUsdcBalance: {
      data: BasicSelector<string | undefined>;
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
  };
  configs: {
    feeTiers: BasicSelector<FeeTierSummary[] | undefined>;
    equityTiers: BasicSelector<EquityTiersSummary | undefined>;
  };
  compliance: { data: BasicSelector<Compliance>; loading: BasicSelector<LoadableStatus> };
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
    stats: {
      data: selectUserStats,
    },
    balances: {
      data: selectAccountBalances,
    },
    nobleUsdcBalance: {
      data: selectAccountNobleUsdcBalance,
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
    apiState: selectApiState,
  },
  configs: {
    equityTiers: selectEquityTiers,
    feeTiers: selectFeeTiers,
  },
  compliance: { data: selectCompliance, loading: selectComplianceLoading },
};

interface BonsaiRawShape {
  parentSubaccountBase: BasicSelector<ParentSubaccountDataBase | undefined>;
  // DANGER: only the CURRENT relevant markets, so you cannot use if your operation might make MORE markets relevant
  // e.g. any place order
  parentSubaccountRelevantMarkets: BasicSelector<MarketsData | undefined>;
  // DANGER: updates a lot
  allMarkets: BasicSelector<MarketsData | undefined>;
}

export const BonsaiRaw: BonsaiRawShape = {
  parentSubaccountBase: selectRawParentSubaccountData,
  parentSubaccountRelevantMarkets: selectRelevantMarketsData,
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

    account: {
      openOrders: BasicSelector<SubaccountOrder[]>;
      orderHistory: BasicSelector<SubaccountOrder[]>;
      fills: BasicSelector<SubaccountFill[]>;
    };
    orderbook: {
      createSelectGroupedData: ParameterizedSelector<
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
    createSelectAssetInfo: ParameterizedSelector<AssetData | undefined, [string | undefined]>;
    createSelectAssetLogo: ParameterizedSelector<string | undefined, [string | undefined]>;
  };
  markets: {
    createSelectMarketSummaryById: ParameterizedSelector<
      PerpetualMarketSummary | undefined,
      [string | undefined]
    >;
  };
  forms: {
    deposit: {
      createSelectParentSubaccountSummary: ParameterizedSelector<
        GroupedSubaccountSummary | undefined,
        [DepositUsdcProps]
      >;
    };
    withdraw: {
      createSelectParentSubaccountSummary: ParameterizedSelector<
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
    orderbook: {
      createSelectGroupedData: createSelectCurrentMarketOrderbook,
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
      openOrders: selectCurrentMarketOpenOrders,
      orderHistory: selectCurrentMarketOrderHistory,
      fills: getCurrentMarketAccountFills,
    },
  },
  assets: {
    // only use this for launchable assets, otherwise use market info
    createSelectAssetInfo,
    createSelectAssetLogo,
  },
  markets: {
    createSelectMarketSummaryById,
  },
  forms: {
    deposit: {
      createSelectParentSubaccountSummary: createSelectParentSubaccountSummaryDeposit,
    },
    withdraw: {
      createSelectParentSubaccountSummary: createSelectParentSubaccountSummaryWithdrawal,
    },
  },
  unopenedIsolatedPositions: selectUnopenedIsolatedPositions,
};

interface BonsaiHooksShape {
  useCurrentMarketHistoricalFunding: () => Loadable<HistoricalFundingObject[]>;
  useCurrentMarketLiveTrades: () => Loadable<IndexerWsTradesUpdateObject>;
  useDailyCumulativeTradingRewards: () => Loadable<AggregatedTradingReward[]>;
  useHistoricalTradingRewards: () => Loadable<IndexerHistoricalTradingRewardAggregation[]>;
  useHistoricalTradingRewardsWeekly: () => Loadable<BigNumber>;
  useParentSubaccountHistoricalPnls: () => Loadable<SubaccountPnlTick[]>;
  useTotalTradingRewards: () => Loadable<BigNumber>;
  useStakingRewards: () => Loadable<StakingRewards>;
  useUnbondingDelegations: () => Loadable<UnbondingDelegation[]>;
  useStakingDelegations: () => Loadable<StakingDelegationsResult>;
}

export const BonsaiHooks: BonsaiHooksShape = {
  useCurrentMarketHistoricalFunding,
  useCurrentMarketLiveTrades: useCurrentMarketTradesValue,
  useDailyCumulativeTradingRewards,
  useHistoricalTradingRewards,
  useHistoricalTradingRewardsWeekly,
  useParentSubaccountHistoricalPnls,
  useStakingRewards,
  useTotalTradingRewards,
  useUnbondingDelegations,
  useStakingDelegations,
};
