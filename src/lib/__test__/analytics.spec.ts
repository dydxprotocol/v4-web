import { describe, expect, it, vi } from 'vitest';

import * as analytics from '@/constants/analytics';

import { identify, track } from '@/lib/analytics/analytics';

describe('identify', () => {
  it('initializes and dispatches custom identify event with property and propertyValue', () => {
    const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
    const customIdentifyEventSpy = vi.spyOn(analytics, 'customIdentifyEvent');
    const propertyVal = 'TABLET';

    identify(analytics.AnalyticsUserProperties.Breakpoint(propertyVal));

    expect(customIdentifyEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          property:
            analytics.AnalyticsUserPropertyLoggableTypes[
              analytics.AnalyticsUserProperties.Breakpoint(propertyVal).type
            ],
          propertyValue: propertyVal,
        }),
      })
    );

    expect(dispatchEventSpy).toHaveBeenCalled();
  });
});

describe('track', () => {
  it('initializes and dispatches custom track event with eventType and eventData', () => {
    const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
    const customTrackEventSpy = vi.spyOn(analytics, 'customTrackEvent');

    track({
      type: 'AppStart',
      payload: {},
    });

    expect(customTrackEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          eventType: 'AppStart',
          eventData: expect.any(Object),
        }),
      })
    );

    expect(dispatchEventSpy).toHaveBeenCalled();
  });
});
