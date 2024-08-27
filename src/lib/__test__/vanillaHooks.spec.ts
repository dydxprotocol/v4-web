import { describe, expect, it, vi } from 'vitest';

import hooks from '../vanillaHooks';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('test hooks', () => {
  it('use effect and state', async () => {
    const fn = hooks.hooked(() => {
      const [state, setState] = hooks.useState(0);
      hooks.useEffect(() => {
        setTimeout(() => setState((s) => s + 1), 500);
      }, []);
      return state;
    });

    expect(fn()).toEqual(0);
    await delay(100);
    expect(fn()).toEqual(0);
    await delay(500);
    expect(fn()).toEqual(1);
  });

  it('something else', async () => {
    const handleInternal = vi.fn().mockImplementation(() => {
      fn(1);
    });
    const fn = hooks.hooked((arg: number) => {
      const [state, setState] = hooks.useState(0);
      hooks.useEffect(() => {
        setTimeout(() => setState((s) => s + 1), 500);
      }, []);
      return state + arg;
    }, handleInternal);

    expect(handleInternal).not.toHaveBeenCalled();
    expect(fn(1)).toEqual(1);
    expect(handleInternal).not.toHaveBeenCalled();
    await delay(100);
    expect(handleInternal).not.toHaveBeenCalled();
    expect(fn(1)).toEqual(1);
    await delay(500);
    expect(handleInternal).toHaveBeenCalledOnce();
    expect(fn(1)).toEqual(2);
  });
});
