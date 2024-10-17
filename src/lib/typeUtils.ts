import { EMPTY_OBJ } from '@/constants/objects';

import { MapOf } from './objectHelpers';

// preserves reference and empty object never churns
export function orEmptyRecord<T>(obj: MapOf<T> | null | undefined): MapOf<T> {
  return obj ?? (EMPTY_OBJ as any);
}

export function orEmptyObj<T extends object>(obj: T | null | undefined): Partial<T> {
  return obj ?? (EMPTY_OBJ as any);
}

export function isPresent<T>(value: T | undefined | null): value is T {
  return value != null;
}
