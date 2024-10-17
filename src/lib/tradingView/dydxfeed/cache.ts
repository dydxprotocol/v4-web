import type {
  Bar,
  ResolutionString,
  SubscribeBarsCallback,
} from 'public/tradingview/charting_library';

import { MapOf } from '@/lib/objectHelpers';

export const lastBarsCache = new Map();
export const subscriptionsByChannelId: Map<
  string,
  {
    subscribeUID: string;
    resolution: ResolutionString;
    lastBar: Bar;
    handlers: MapOf<{ id: string; callback: SubscribeBarsCallback }>;
  }
> = new Map();
