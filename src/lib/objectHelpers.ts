/** Object.entries() with key types preserved */
export const objectEntries = <T extends object>(t: T) =>
  Object.entries(t) as { [K in keyof T]: [K, T[K]] }[keyof T][];

// Object.keys() with key types preserved - NOT SAFE for mutable variables, only readonly/consts that are never modified
// since typescript is structurally typed and objects can contain extra keys and still be valid objects of type T
export const objectKeys = <T extends object>(t: T) => Object.keys(t) as Array<keyof T>;
