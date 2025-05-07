export class TimeEjectingSet {
  private storage: Record<string, number> = {};

  constructor(private readonly expirationMs: number = 60000) {}

  add(value: string, expirationMs?: number): void {
    const expiration = expirationMs ?? this.expirationMs;
    const expirationTime = Date.now() + expiration;
    this.storage[value] = expirationTime;
  }

  has(value: string): boolean {
    if (!(value in this.storage)) {
      return false;
    }

    const expirationTime = this.storage[value]!;
    if (Date.now() > expirationTime) {
      delete this.storage[value];
      return false;
    }

    return true;
  }

  remove(value: string): boolean {
    if (value in this.storage) {
      delete this.storage[value];
      return true;
    }
    return false;
  }
}
