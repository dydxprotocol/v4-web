// Good Til Time Timescales
export enum TimeUnitShort {
  Minutes = 'M',
  Hours = 'H',
  Days = 'D',
  Weeks = 'W',
}

export const timeUnits = {
  year: 31536000000,
  month: 2628000000,
  week: 604800000,
  day: 86400000,
  hour: 3600000,
  minute: 60000,
  second: 1000,
} satisfies Partial<Record<Intl.RelativeTimeFormatUnit, number>>;

const smallTimeUnits = {
  decisecond: 100,
  centisecond: 10,
  millisecond: 1,
} satisfies Partial<Record<string, number>>;

const otherTimeUnits = {
  threeDays: 3 * timeUnits.day,
} satisfies Partial<Record<string, number>>;

export const allTimeUnits = {
  ...timeUnits,
  ...smallTimeUnits,
  ...otherTimeUnits,
};
