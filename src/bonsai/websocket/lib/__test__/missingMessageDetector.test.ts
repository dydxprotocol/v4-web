import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MissingMessageDetector } from '../missingMessageDetector';

describe('MissingMessageDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores sequential messages', () => {
    const onTimeout = vi.fn();
    const detector = new MissingMessageDetector(onTimeout, 100);

    detector.insert(1);
    detector.insert(2);
    vi.advanceTimersByTime(100);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('allows a missing message to arrive before its timeout', () => {
    const onTimeout = vi.fn();
    const detector = new MissingMessageDetector(onTimeout, 100);

    detector.insert(1);
    detector.insert(3);
    detector.insert(2);
    vi.advanceTimersByTime(100);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('clears pending timeouts on cleanup', () => {
    const onTimeout = vi.fn();
    const detector = new MissingMessageDetector(onTimeout, 100);

    detector.insert(1);
    detector.insert(3);
    detector.cleanup();
    vi.advanceTimersByTime(100);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('fails once without allocating timers when the tracked gap is too large', () => {
    const onTimeout = vi.fn();
    const detector = new MissingMessageDetector(onTimeout, 100);

    detector.insert(1);
    detector.insert(1_003);
    detector.insert(2_005);

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledWith(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
