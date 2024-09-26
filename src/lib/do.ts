export function run<T>(fn: () => T): T {
  return fn();
}

type NonNullableArray<T extends readonly any[]> = {
  [K in keyof T]: NonNullable<T[K]>;
};

export function runIf<Args extends any[], T>(
  ...args: [...Args, (...args: NonNullableArray<Args>) => T]
): T | undefined {
  if ([...args].some((f) => f == null)) {
    return undefined;
  }
  return args[args.length - 1](...args.slice(0, args.length - 1));
}
