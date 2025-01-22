import { EMPTY_OBJ } from '@/constants/objects';

// preserves reference and empty object never churns
export function orEmptyRecord<T>(obj: Record<string, T> | null | undefined): Record<string, T> {
  return obj ?? (EMPTY_OBJ as any);
}

export function orEmptyObj<T extends object>(obj: T | null | undefined): Partial<T> {
  return obj ?? (EMPTY_OBJ as any);
}

export function isPresent<T>(value: T | undefined | null): value is T {
  return value != null;
}

export function isValidKey<K extends keyof any>(
  key: string | number | symbol,
  obj: Record<K, any>
): key is K {
  return key in obj;
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
