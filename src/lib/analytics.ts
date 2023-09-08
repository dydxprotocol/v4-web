import type {
  AnalyticsUserProperty,
  AnalyticsUserPropertyValue,
  AnalyticsEvent,
  AnalyticsEventData,
} from '@/constants/analytics';

export const identify = <T extends AnalyticsUserProperty>(
  property: T,
  propertyValue: AnalyticsUserPropertyValue<T>
) => {
  const customEvent = new CustomEvent('dydx:identify', {
    detail: { property, propertyValue },
  });

  globalThis.dispatchEvent(customEvent);
};

export const track = <T extends AnalyticsEvent>(
  eventType: T,
  eventData?: AnalyticsEventData<T>
) => {
  const customEvent = new CustomEvent('dydx:track', {
    detail: { eventType, eventData },
  });

  globalThis.dispatchEvent(customEvent);
};
