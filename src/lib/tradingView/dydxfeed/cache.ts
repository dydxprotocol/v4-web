import type {
  Bar,
  ResolutionString,
  SubscribeBarsCallback,
} from 'public/tradingview/charting_library';

export const lastBarsCache = new Map();
export const subscriptionsByChannelId: Map<
  string,
  {
    subscribeUID: string;
    resolution: ResolutionString;
    lastBar: Bar;
    handlers: Record<string, { id: string; callback: SubscribeBarsCallback }>;
  }
> = new Map();
