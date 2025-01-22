import type { ResolutionString, SubscribeBarsCallback } from 'public/tradingview/charting_library';

export const subscriptionsByChannelId: Map<
  string,
  {
    subscribeUID: string;
    resolution: ResolutionString;
    handlers: Record<string, { id: string; callback: SubscribeBarsCallback }>;
  }
> = new Map();
