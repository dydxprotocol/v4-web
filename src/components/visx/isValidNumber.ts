// https://github.com/airbnb/visx/blob/master/packages/visx-xychart/src/typeguards/isValidNumber.ts

export function isValidNumber(_: unknown): _ is number {
  return _ != null && typeof _ === 'number' && !Number.isNaN(_) && Number.isFinite(_);
}
