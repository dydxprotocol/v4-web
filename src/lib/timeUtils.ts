import { DateTime, type Duration } from 'luxon';

import { STRING_KEYS } from '@/constants/localization';

import { BigNumberish } from '@/lib/numbers';

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
    case 'minute':
      return 60 - now.getSeconds();
    case 'hour':
      return 3600 - (now.getMinutes() * 60 + now.getSeconds());
    case 'day':
      const secondsTillNextHour = 3600 - (now.getMinutes() * 60 + now.getSeconds());
      const hoursTillNextDay = 24 - (now.getHours() + 1);
      return secondsTillNextHour + hoursTillNextDay * 3600;
  }
};

export const getTimeString = (time: number) => time.toString().padStart(2, '0');

export const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${getTimeString(minutes)}:${getTimeString(remainingSeconds)}`;
};
