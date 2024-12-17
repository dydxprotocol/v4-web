import { setUpAssetsQuery } from './rest/assets';
import { setUpBlockTradingRewardsQuery } from './rest/blockTradingRewards';
import { setUpFillsQuery } from './rest/fills';
import { setUpIndexerHeightQuery, setUpValidatorHeightQuery } from './rest/height';
import { alwaysUseCurrentNetworkClient } from './rest/lib/compositeClientManager';
import { setUpOrdersQuery } from './rest/orders';
import { setUpTransfersQuery } from './rest/transfers';
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
  setUpIndexerHeightQuery,
  setUpValidatorHeightQuery,
] as const;
