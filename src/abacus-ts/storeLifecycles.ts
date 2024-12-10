import { setUpBlockTradingRewardsQuery } from './rest/blockTradingRewards';
import { setUpFillsQuery } from './rest/fills';
import { setUpOrdersQuery } from './rest/orders';
import { setUpTransfersQuery } from './rest/transfers';
import { setUpMarkets } from './websocket/markets';
import { setUpOrderbook } from './websocket/orderbook';
import { setUpParentSubaccount } from './websocket/parentSubaccount';

export const storeLifecycles = [
  setUpMarkets,
  setUpParentSubaccount,
  setUpFillsQuery,
  setUpOrdersQuery,
  setUpTransfersQuery,
  setUpBlockTradingRewardsQuery,
  setUpOrderbook,
] as const;
