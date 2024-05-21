const EMPTY_OBJ_REF = Object.freeze({});
// preserves reference and empty object never churns
export function orEmptyObj<T extends object>(obj: T | null | undefined): Partial<T> {
  return obj ?? EMPTY_OBJ_REF;
}

export function isPresent<T>(value: T | undefined | null): value is T {
  return value != null;
}
