type CacheEntry<T> = {
  resource: T;
  count: number;
  destroyTimeout?: NodeJS.Timeout;
};

type Cache<T> = {
  [key: string]: CacheEntry<T>;
};

export class ResourceCacheManager<T, U> {
  private cache: Cache<T> = {};

  constructor(
    private options: {
      constructor: (key: U) => T;
      destroyer: (resource: NoInfer<T>) => void;
      keySerializer: (key: NoInfer<U>) => string;
      destroyDelayMs?: number;
    }
  ) {}

  use(key: U): T {
    const serializedKey = this.options.keySerializer(key);

    this.cache[serializedKey] ??= {
      resource: this.options.constructor(key),
      count: 0,
    };

    const entry = this.cache[serializedKey];
    entry.count += 1;

    if (entry.destroyTimeout) {
      clearTimeout(entry.destroyTimeout);
      entry.destroyTimeout = undefined;
    }

    return entry.resource;
  }

  markDone(key: U): void {
    const serializedKey = this.options.keySerializer(key);
    const entry = this.cache[serializedKey];
    if (!entry) return;

    entry.count -= 1;

    if (entry.destroyTimeout) {
      clearTimeout(entry.destroyTimeout);
      entry.destroyTimeout = undefined;
    }

    if (entry.count === 0) {
      const delay = this.options.destroyDelayMs ?? 1000;
      entry.destroyTimeout = setTimeout(() => {
        const latestVal = this.cache[serializedKey];
        if (!latestVal) return;

        this.options.destroyer(latestVal.resource);
        delete this.cache[serializedKey];
      }, delay);
    }
  }
}
