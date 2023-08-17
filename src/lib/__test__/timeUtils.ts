import { describe, expect, it } from 'vitest';
import { DateTime, Duration } from 'luxon';

import { MustBigNumber } from '@/lib/numbers';

import {
  getTimestamp,
  getStringsForDateTimeDiff,
  getStringsForTimeInterval,
  getTimeTillNextUnit,
  getTimeString,
} from '@/lib/timeUtils';

describe('getTimestamp', () => {
  it('returns the timestamp from a number', () => {
    const timestamp = new Date().getTime();
    expect(getTimestamp(timestamp)).toEqual(timestamp);
  });

  it('returns the timestamp from a string', () => {
    const timestamp = new Date().toISOString();
    expect(getTimestamp(timestamp)).toEqual(new Date(timestamp).getTime());
  });

  it('returns the timestamp from a BigNumber', () => {
    const timestamp = MustBigNumber(new Date().getTime());
    expect(getTimestamp(timestamp)).toEqual(timestamp.toNumber());
  });

  it('returns undefined when no value is provided', () => {
    expect(getTimestamp()).toBeUndefined();
  });
});

describe('getStringsForDateTimeDiff', () => {
  it('returns an object with timeString, unitStringKey, and hasExpirationWarning properties', () => {
    const dateTime = DateTime.local().plus({ days: 2 });
    const result = getStringsForDateTimeDiff(dateTime);

    expect(result).toHaveProperty('timeString');
    expect(result).toHaveProperty('unitStringKey');
    expect(result).toHaveProperty('hasExpirationWarning');
  });
});

describe('getStringsForTimeInterval', () => {
  it.each([
    [Duration.fromObject({ months: 2 }), '2', 'MONTHS_ABBREVIATED'],
    [Duration.fromObject({ weeks: 3, days: 2 }), '3', 'WEEKS_ABBREVIATED'],
    [Duration.fromObject({ days: 5, hours: 12 }), '6', 'DAYS_ABBREVIATED'],
    [Duration.fromObject({ hours: 8, minutes: 30 }), '9', 'HOURS_ABBREVIATED'],
    [Duration.fromObject({ minutes: 45 }), '45', 'MINUTES_ABBREVIATED'],
  ])(
    'returns the correct timeString and unitStringKey',
    (timeInterval, expectedTimeString, expectedUnitStringKey) => {
      const result = getStringsForTimeInterval(timeInterval);

      expect(result.timeString).toEqual(expectedTimeString);
      expect(result.unitStringKey).toEqual(expectedUnitStringKey);
    }
  );
});

describe('getTimeTillNextUnit', () => {
  it('returns the number of seconds remaining until the next minute', () => {
    const now = new Date();
    const secondsElapsed = now.getSeconds();
    const expectedSecondsLeft = 60 - secondsElapsed;
    const result = getTimeTillNextUnit('minute');

    expect(result).toEqual(expectedSecondsLeft);
  });

  it('returns the number of seconds remaining until the next hour', () => {
    const now = new Date();
    const secondsElapsed = now.getMinutes() * 60 + now.getSeconds();
    const expectedSecondsLeft = 3600 - secondsElapsed;
    const result = getTimeTillNextUnit('hour');

    expect(result).toEqual(expectedSecondsLeft);
  });

  it('returns the number of seconds remaining until the next day', () => {
    const now = new Date();
    const secondsTillNextHour = 3600 - (now.getMinutes() * 60 + now.getSeconds());
    const hoursTillNextDay = 24 - (now.getHours() + 1);
    const expectedSecondsLeft = secondsTillNextHour + hoursTillNextDay * 3600;
    const result = getTimeTillNextUnit('day');

    expect(result).toEqual(expectedSecondsLeft);
  });
});

describe('getTimeString', () => {
  it('returns a zero-padded string for single-digit numbers', () => {
    const input = 7;
    const expectedResult = '07';
    const result = getTimeString(input);

    expect(result).toEqual(expectedResult);
  });

  it('returns the same string for double-digit numbers', () => {
    const input = 42;
    const expectedResult = '42';
    const result = getTimeString(input);

    expect(result).toEqual(expectedResult);
  });
});
