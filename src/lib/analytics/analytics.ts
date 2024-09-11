import {
  AnalyticsUserPropertyLoggableTypes,
  customIdentifyEvent,
  customTrackEvent,
  type AnalyticsEvent,
  type AnalyticsUserProperty,
} from '@/constants/analytics';

import { dd } from './datadog';

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
  const ddPropertyName = `user-property-${propertyTypeToLog}`;
  dd.setContextProperty(ddPropertyName, property.payload);
  dd.info(`set context item: ${ddPropertyName} to value ${property.payload}`, dd.getContext());

  globalThis.dispatchEvent(customEvent);
};

export const track = (event: AnalyticsEvent) => {
  if (DEBUG_ANALYTICS || import.meta.env.VITE_LOG_TRACK_EVENTS === 'true') {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] ${event.type}`, event.payload);
  }
  const customEvent = customTrackEvent({
    detail: { eventType: event.type, eventData: event.payload },
  });

  globalThis.dispatchEvent(customEvent);
};
