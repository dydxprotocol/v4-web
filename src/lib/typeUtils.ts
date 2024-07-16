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
