import { setUpLocalOrdersFillsSync, setUpLocalOrdersOrdersSync } from './lifecycles/localOrders';
import { setUpNobleBalanceSweepLifecycle } from './lifecycles/nobleBalanceSweepLifecycle';
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
import { alwaysUseCurrentNetworkClient } from './rest/lib/compositeClientManager';
import { setUpNobleBalanceQuery } from './rest/nobleBalance';
import { setUpOrdersQuery } from './rest/orders';
import { setUpSparklinesQuery } from './rest/sparklines';
import { setUpTransfersQuery } from './rest/transfers';
import {
  setUpAccountBalancesQuery,
  setUpAccountFeeTierQuery,
  setUpAccountStatsQuery,
} from './rest/validatorAccountMetadata';
import { setUpMarkets } from './websocket/markets';
import { setUpOrderbook } from './websocket/orderbook';
import { setUpParentSubaccount } from './websocket/parentSubaccount';

export const storeLifecycles = [
  alwaysUseCurrentNetworkClient,
  setUpMarkets,
  setUpAssetsQuery,
  setUpParentSubaccount,
  setUpFillsQuery,
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
  setUpConfigTiersQuery,
  setUpLocalOrdersFillsSync,
  setUpLocalOrdersOrdersSync,
  setUpGeoQuery,
  setUpIndexerSourceAddressScreenV2Query,
  setUpIndexerLocalAddressScreenV2Query,
  setUpUsdcRebalanceLifecycle,
  setUpNobleBalanceQuery,
  setUpNobleBalanceSweepLifecycle,
] as const;
