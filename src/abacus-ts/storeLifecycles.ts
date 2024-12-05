import { setUpMarkets } from './websocket/markets';
import { setUpParentSubaccount } from './websocket/parentSubaccount';

export const storeLifecycles = [setUpMarkets, setUpParentSubaccount] as const;
