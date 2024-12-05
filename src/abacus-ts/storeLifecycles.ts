import { setUpMarkets } from './websocket/markets';

export const storeLifecycles = [setUpMarkets] as const;
