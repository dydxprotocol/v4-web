import { setUpCancelOrphanedTriggerOrdersLifecycle } from './lifecycles/cancelTriggerOrdersLifecycle';
import { setUpLocalOrdersOrdersSync } from './lifecycles/localOrders';
import { setUpNobleBalanceSweepLifecycle } from './lifecycles/nobleBalanceSweepLifecycle';
import { setUpReclaimChildSubaccountBalancesLifecycle } from './lifecycles/reclaimChildSubaccountBalancesLifecycle';
import { setUpUsdcRebalanceLifecycle } from './lifecycles/usdcRebalanceLifecycle';
import { setUpAssetsQuery } from './rest/assets';
import { setUpBlockTradingRewardsQuery } from './rest/blockTradingRewards';
import {
  setUpIndexerLocalAddressScreenV2Query,
  setUpIndexerSourceAddressScreenV2Query,
} from './rest/compliance';
import { setUpConfigTiersQuery } from './rest/configTiers';
import { setUpFillsQuery } from './rest/fills';
import { setUpGeoQuery } from './rest/geo';
import { setUpIndexerHeightQuery, setUpValidatorHeightQuery } from './rest/height';
import { setUpUserLeverageParamsQuery } from './rest/leverage';
import { alwaysUseCurrentNetworkClient } from './rest/lib/compositeClientManager';
import { setUpNobleBalanceQuery } from './rest/nobleBalance';
import { setUpOrdersQuery } from './rest/orders';
import { setUpRewardsParamsQuery, setUpRewardsTokenPriceQuery } from './rest/rewards';
import { setUpSparklinesQuery } from './rest/sparklines';
import {
  setUpPortfolioTradesQuery,
  setUpSolPriceQuery,
  setUpSpotTokenPriceQuery,
  setUpTokenMetadataQuery,
} from './rest/spot';
import { setUpTransfersQuery } from './rest/transfers';
import {
  setUpAccountBalancesQuery,
  setUpAccountFeeTierQuery,
  setUpAccountStakingTierQuery,
  setUpAccountStatsQuery,
  setUpCompositeClientAccountCacheQuery,
} from './rest/validatorAccountMetadata';
import { setUpMarketsFeeDiscountQuery } from './rest/validatorMarketsMetadata';
import { setUpMarkets } from './websocket/markets';
import { setUpOrderbook } from './websocket/orderbook';
import { setUpParentSubaccount } from './websocket/parentSubaccount';
import { setUpSpotWalletPositions } from './websocket/spot';

const spotLifeCycles = [
  setUpSolPriceQuery,
  setUpSpotTokenPriceQuery,
  setUpSpotWalletPositions,
  setUpTokenMetadataQuery,
  setUpPortfolioTradesQuery,
];

export const storeLifecycles = [
  alwaysUseCurrentNetworkClient,
  setUpMarkets,
  setUpAssetsQuery,
  setUpParentSubaccount,
  setUpFillsQuery,
  setUpUserLeverageParamsQuery,
  setUpOrdersQuery,
  setUpTransfersQuery,
  setUpBlockTradingRewardsQuery,
  setUpOrderbook,
  setUpSparklinesQuery,
  setUpIndexerHeightQuery,
  setUpValidatorHeightQuery,
  setUpAccountStatsQuery,
  setUpAccountBalancesQuery,
  setUpAccountFeeTierQuery,
  setUpCompositeClientAccountCacheQuery,
  setUpConfigTiersQuery,
  setUpLocalOrdersOrdersSync,
  setUpGeoQuery,
  setUpIndexerSourceAddressScreenV2Query,
  setUpIndexerLocalAddressScreenV2Query,
  setUpUsdcRebalanceLifecycle,
  setUpNobleBalanceQuery,
  setUpNobleBalanceSweepLifecycle,
  setUpRewardsParamsQuery,
  setUpRewardsTokenPriceQuery,
  setUpCancelOrphanedTriggerOrdersLifecycle,
  setUpReclaimChildSubaccountBalancesLifecycle,
  setUpMarketsFeeDiscountQuery,
  setUpAccountStakingTierQuery,
  ...spotLifeCycles,
] as const;
