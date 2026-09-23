import { afterEach, describe, expect, it, vi } from 'vitest';

import { MissingMessageDetector } from '../missingMessageDetector';

describe('MissingMessageDetector', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reconnects immediately instead of allocating timers for an anomalous gap', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const detector = new MissingMessageDetector(onTimeout);

    detector.insert(1);
    detector.insert(1_000_000);

    expect(onTimeout).toHaveBeenCalledWith(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('still waits for normal out-of-order messages', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const detector = new MissingMessageDetector(onTimeout, 100);

    detector.insert(1);
    detector.insert(3);
    detector.insert(2);
    vi.advanceTimersByTime(100);

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
