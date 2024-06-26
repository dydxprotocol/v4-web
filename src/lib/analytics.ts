import {
  AnalyticsUserPropertyLoggableTypes,
  customIdentifyEvent,
  customTrackEvent,
  type AnalyticsEvent,
  type AnalyticsUserProperty,
} from '@/constants/analytics';

import { testFlags } from './testFlags';

const DEBUG_ANALYTICS = false;

export const identify = (property: AnalyticsUserProperty) => {
  const propertyTypeToLog = AnalyticsUserPropertyLoggableTypes[property.type];

  if (DEBUG_ANALYTICS) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics:Identify] ${propertyTypeToLog}`, property.payload);
  }

  const customEvent = customIdentifyEvent({
    detail: { property: propertyTypeToLog, propertyValue: property.payload },
  });

  globalThis.dispatchEvent(customEvent);
};

export const track = (event: AnalyticsEvent) => {
  const eventDataWithReferrer = { ...(event.payload ?? {}), referrer: testFlags.referrer };
  if (DEBUG_ANALYTICS) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] ${event.type}`, eventDataWithReferrer);
  }
  const customEvent = customTrackEvent({
    detail: { eventType: event.type, eventData: eventDataWithReferrer },
  });

  globalThis.dispatchEvent(customEvent);
};
