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

  it('syncs store', async () => {
    let subs: Array<() => void> = [];
    const addSubOne = vi.fn().mockImplementation((onChange: () => void) => {
      subs.push(onChange);
      return () => {
        subs = subs.filter((s) => s !== onChange);
      };
    });
    const addSubTwo = vi.fn().mockImplementation((onChange: () => void) => {
      subs.push(onChange);
      return () => {
        subs = subs.filter((s) => s !== onChange);
      };
    });
    const addSub = { sub: addSubOne };
    let storeValue = 0;
    const setStoreValue = (val: number) => {
      storeValue = val;
      subs.forEach((s) => s());
    };
    const getStoreValue = () => storeValue;

    const fn = hooks.hooked(() => {
      const storeVal = hooks.useSyncExternalStore(addSub.sub, getStoreValue);

      return storeVal + 1;
    });

    expect(fn()).toEqual(1);
    expect(addSubOne).not.toHaveBeenCalled();
    expect(subs.length).toEqual(0);
    await delay(10);
    expect(addSubOne).toHaveBeenCalledOnce();
    expect(addSubTwo).not.toHaveBeenCalled();
    expect(subs.length).toEqual(1);
    expect(fn()).toEqual(1);
    setStoreValue(1);
    // value is updated right away even though rerender hasn't happened yet
    expect(fn()).toEqual(2);
    await delay(10);
    expect(fn()).toEqual(2);

    const oldsub = subs[0];
    addSub.sub = addSubTwo;
    expect(fn()).toEqual(2);
    expect(subs.length).toEqual(1);
    await delay(10);
    expect(fn()).toEqual(2);
    expect(subs.length).toEqual(1);
    expect(subs[0]).not.toEqual(oldsub);
    expect(addSubTwo).toHaveBeenCalledTimes(1);

    setStoreValue(2);
    await delay(10);
    expect(fn()).toEqual(3);

    hooks.dropEffect(fn);
    expect(subs.length).toEqual(1);
    await delay(10);
    expect(subs.length).toEqual(0);
  });
});
