import { setUpFillsQuery } from './rest/fills';
import { setUpOrdersQuery } from './rest/orders';
import { setUpMarkets } from './websocket/markets';
import { setUpParentSubaccount } from './websocket/parentSubaccount';

export const storeLifecycles = [
  setUpMarkets,
  setUpParentSubaccount,
  setUpFillsQuery,
  setUpOrdersQuery,
] as const;
