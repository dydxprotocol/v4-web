/** Object.entries() with key types preserved */
export const objectEntries = <T extends object>(t: T) =>
  Object.entries(t) as { [K in keyof T]: [K, T[K]] }[keyof T][];

/** Object.fromEntries() with key types preserved */
export const objectFromEntries = <const T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
  entries: T
): { [K in T[number] as K[0]]: K[1] } => {
  return Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] };
};

// Object.keys() with key types preserved - NOT SAFE for mutable variables, only readonly/consts that are never modified
// since typescript is structurally typed and objects can contain extra keys and still be valid objects of type T
export const objectKeys = <T extends object>(t: T) => Object.keys(t) as Array<keyof T>;
