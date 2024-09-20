import { pick } from 'lodash';

/** Object.entries() with key types preserved */
export const objectEntries = <T extends object>(t: T) =>
  Object.entries(t) as { [K in keyof T]: [K, T[K]] }[keyof T][];

// Object.keys() with key types preserved - NOT SAFE for mutable variables, only readonly/consts that are never modified
// since typescript is structurally typed and objects can contain extra keys and still be valid objects of type T
export const objectKeys = <T extends object>(t: T) => Object.keys(t) as Array<keyof T>;

// An alias for Object.assign. Our Abacus-generated types contian properties as getter functions which typescript can't be sure
// can be safely splatted like {...someObject}. Object.assign is slightly slower but guarantees all the properties will get copied
// and the result is typed correctly by the type system
export const safeAssign = Object.assign;

export const safePick: <T extends object, U extends keyof T>(
  t: T,
  ...args: Array<U>
) => Pick<T, U> = pick;
