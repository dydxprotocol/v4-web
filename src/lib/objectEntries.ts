/** Object.entries() with key types preserved */
export const objectEntries = <T extends object>(t: T) => Object.entries(t) as { [K in keyof T]: [K, T[K]] }[keyof T][];
