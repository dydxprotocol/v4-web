import {
  customIdentifyEvent,
  customTrackEvent,
  type AnalyticsEvent,
  type AnalyticsUserProperty,
} from '@/constants/analytics';

import { testFlags } from './testFlags';

const DEBUG_ANALYTICS = false;

export const identify = (property: AnalyticsUserProperty) => {
  if (DEBUG_ANALYTICS) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics:Identify] ${property.type}`, property.payload);
  }

  const customEvent = customIdentifyEvent(property);

  globalThis.dispatchEvent(customEvent);
};

export const track = (event: AnalyticsEvent) => {
  if (DEBUG_ANALYTICS) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] ${event.type}`, event.payload, testFlags.referrer);
  }
  const customEvent = customTrackEvent(event, testFlags.referrer);

  globalThis.dispatchEvent(customEvent);
};
