import { logBonsaiInfo } from '@/bonsai/logs';
import { utils } from '@dydxprotocol/v4-client-js';
import { isFinite } from 'lodash';
import { DateTime, type Duration } from 'luxon';

import { STRING_KEYS } from '@/constants/localization';

import { BigNumberish } from '@/lib/numbers';

import { calc } from './do';

export const getTimestamp = (value?: BigNumberish | null) =>
  value
    ? typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? new Date(value).getTime()
        : new Date(value.toString()).getTime()
    : undefined;

export const getStringsForDateTimeDiff = (dateTime: DateTime) => {
  const diffResults = DateTime.local().diff(dateTime, ['weeks', 'days', 'hours', 'minutes']);
  const { timeString, unitStringKey } = getStringsForTimeInterval(diffResults);

  return {
    timeString,
    unitStringKey,
    hasExpirationWarning: diffResults.weeks === 0 && Math.abs(diffResults.days) < 3,
  };
};

export const getStringsForTimeInterval = (timeInterval: Duration) => {
  const months = Math.abs(timeInterval.months ?? 0);
  const weeks = Math.abs(timeInterval.weeks ?? 0);
  const days = Math.abs(timeInterval.days ?? 0);
  const hours = Math.abs(timeInterval.hours ?? 0);
  const minutes = Math.abs(timeInterval.minutes ?? 0);

  let timeString;
  let unitStringKey;

  if (months > 0) {
    timeString = Math.round(months).toString();
    unitStringKey = STRING_KEYS.MONTHS_ABBREVIATED;
  } else if (weeks > 0) {
    timeString = Math.round(weeks + days / 7).toString();
    unitStringKey = STRING_KEYS.WEEKS_ABBREVIATED;
  } else if (days > 0) {
    timeString = Math.round(days + hours / 24).toString();
    unitStringKey = STRING_KEYS.DAYS_ABBREVIATED;
  } else if (hours > 0) {
    timeString = Math.round(hours + minutes / 60).toString();
    unitStringKey = STRING_KEYS.HOURS_ABBREVIATED;
  } else {
    timeString = Math.ceil(minutes).toString();
    unitStringKey = STRING_KEYS.MINUTES_ABBREVIATED;
  }

  return {
    timeString,
    unitStringKey,
  };
};

export const getTimeTillNextUnit = (unit: 'minute' | 'hour' | 'day') => {
  const now = new Date();
  switch (unit) {
    case 'minute': {
      return 60 - now.getSeconds();
    }
    case 'hour': {
      return 3600 - (now.getMinutes() * 60 + now.getSeconds());
    }
    case 'day': {
      const secondsTillNextHour = 3600 - (now.getMinutes() * 60 + now.getSeconds());
      const hoursTillNextDay = 24 - (now.getHours() + 1);
      return secondsTillNextHour + hoursTillNextDay * 3600;
    }
    default: {
      return undefined;
    }
  }
};

export const getTimeString = (time: number) => time.toString().padStart(2, '0');

export const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${getTimeString(minutes)}:${getTimeString(remainingSeconds)}`;
};

export async function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

const URL_WITH_ACCURATE_TIME_THAT_IS_VERY_FAST_AND_RELIABLE = '/configs/exchanges.json';
const MAX_TIME_TO_WAIT_FOR_FAST_REQUEST = 10000;

export async function getTimestampOffset() {
  // create two promises that never throw and race them
  const offsetPromise = calc(async () => {
    try {
      const start = Date.now();
      const res = await fetch(URL_WITH_ACCURATE_TIME_THAT_IS_VERY_FAST_AND_RELIABLE);
      const end = Date.now();

      const serverDate = res.headers.get('date');
      if (serverDate == null) {
        return 0;
      }
      const serverMs = Date.parse(serverDate);
      if (!isFinite(serverMs)) {
        return 0;
      }
      return utils.calculateClockOffsetFromFetchDateHeader(start, serverMs, end);
    } catch (e) {
      return 0;
    }
  });
  const defaultPromise = calc(async () => {
    try {
      await sleep(MAX_TIME_TO_WAIT_FOR_FAST_REQUEST);
      return 0;
    } catch (e) {
      return 0;
    }
  });

  const start = Date.now();
  const offset = await Promise.race([offsetPromise, defaultPromise]);
  return {
    offset,
    requestDuration: Date.now() - start,
  };
}

export const browserTimeOffsetPromise = sleep(0).then(() => getTimestampOffset());
browserTimeOffsetPromise.then((result) => {
  logBonsaiInfo('browserTimeOffsetCalculator', 'calculated time offset', result);
});
