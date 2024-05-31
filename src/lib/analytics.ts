import {
  customIdentifyEvent,
  customTrackEvent,
  type AnalyticsEvent,
  type AnalyticsEventData,
  type AnalyticsUserProperty,
  type AnalyticsUserPropertyValue,
} from '@/constants/analytics';

import { testFlags } from './testFlags';

const DEBUG_ANALYTICS = false;

export const identify = <T extends AnalyticsUserProperty>(
  property: T,
  propertyValue: AnalyticsUserPropertyValue<T>
) => {
  if (DEBUG_ANALYTICS) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics:Identify] ${property}`, propertyValue);
  }

  const customEvent = customIdentifyEvent({
    detail: { property, propertyValue },
  });

  globalThis.dispatchEvent(customEvent);
};

export const track = <T extends AnalyticsEvent>(
  eventType: T,
  eventData?: AnalyticsEventData<T>
) => {
  const eventDataWithReferrer = { ...(eventData ?? {}), referrer: testFlags.referrer };
  if (DEBUG_ANALYTICS) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] ${eventType}`, eventDataWithReferrer);
  }
  const customEvent = customTrackEvent({
    detail: { eventType, eventData: eventDataWithReferrer },
  });

  globalThis.dispatchEvent(customEvent);
};
