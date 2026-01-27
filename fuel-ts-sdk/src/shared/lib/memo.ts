/* eslint-disable @typescript-eslint/no-explicit-any */
import { memoize } from 'micro-memoize';

export function multimemo<Fn extends (...args: any[]) => any>(
  fn: Fn,
  options?: Parameters<typeof memoize>[1]
): Fn {
  return memoize(fn, { maxSize: 10, ...options }) as Fn;
}

export function monomemo<Fn extends (...args: any[]) => any>(
  fn: Fn,
  options?: Parameters<typeof memoize>[1]
): Fn {
  return memoize(fn, { maxSize: 1, ...options }) as Fn;
}
