import { act, createElement } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnimationFrame } from '../useAnimationFrame';

const actEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };

describe('useAnimationFrame', () => {
  beforeEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    vi.unstubAllGlobals();
  });

  it('only schedules frames while enabled', () => {
    let frame: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    const cancelAnimationFrame = vi.fn();
    const callback = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

    const TestComponent = ({ enabled }: { enabled: boolean }) => {
      useAnimationFrame(callback, enabled);
      return null;
    };
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(createElement(TestComponent, { enabled: false })));

    expect(requestAnimationFrame).not.toHaveBeenCalled();

    act(() => root.render(createElement(TestComponent, { enabled: true })));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    frame?.(0);
    frame?.(16);
    expect(callback).toHaveBeenCalledWith(16);

    act(() => root.render(createElement(TestComponent, { enabled: false })));
    expect(cancelAnimationFrame).toHaveBeenCalled();

    act(() => root.unmount());
  });
});
