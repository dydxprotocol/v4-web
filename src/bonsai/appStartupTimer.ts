import { AppRoute } from '@/constants/routes';
import { timeUnits } from '@/constants/time';

import { logBonsaiInfo } from './logs';

type StartupStats = {
  start: number | undefined;
  renderApp?: number | undefined;
  renderTrade?: number | undefined;
  startMarkets?: number | undefined;
  loadedMarkets?: number | undefined;
  setCurrentMarket?: number | undefined;
  startOrderbook?: number | undefined;
  loadedOrderbook?: number | undefined;
  startCandles?: number | undefined;
  loadedCandles?: number | undefined;
};
const stats: StartupStats = {
  start: performance.now(),
};

const TOO_LONG_STARTUP = 15 * timeUnits.second;

const firstSeenPath = document.location.pathname;

const STARTUP_SAMPLE_RATE = 0.25;

export const AppStartupTimer = {
  timeIfFirst(t: keyof StartupStats) {
    if (stats[t] == null) {
      stats[t] = performance.now();
      if (
        (t === 'loadedCandles' || t === 'loadedOrderbook') &&
        stats.loadedCandles != null &&
        stats.loadedOrderbook != null &&
        performance.now() < TOO_LONG_STARTUP &&
        firstSeenPath.indexOf(AppRoute.Trade) >= 0 &&
        Math.random() < STARTUP_SAMPLE_RATE
      ) {
        logBonsaiInfo('AppStartupTimer', 'App started', stats);
      }
    }
  },
};
