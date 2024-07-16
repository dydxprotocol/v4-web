import { EMPTY_OBJ } from '@/constants/objects';

// preserves reference and empty object never churns
export function orEmptyObj<T extends object>(
  obj: T | null | undefined
): T extends Record<string, infer S> ? Record<string, S> : Partial<T> {
  return obj ?? (EMPTY_OBJ as any);
}

export function orEmptyObjType<T extends object>(obj: T | null | undefined): Partial<T> {
  return obj ?? (EMPTY_OBJ as any);
}

export function isPresent<T>(value: T | undefined | null): value is T {
  return value != null;
}
