import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePromise } from './usePromise';

describe('usePromise', () => {
  describe('without autorun', () => {
    it('starts in unready state', () => {
      const promise = Promise.resolve('test');
      const { result } = renderHook(() => usePromise(promise));

      expect(result.current.status).toBe('unready');
      expect(result.current.data).toBeUndefined();
    });

    it('transitions to fulfilled after initialize is called', async () => {
      const promise = Promise.resolve('test value');
      const { result } = renderHook(() => usePromise(promise));

      act(() => {
        result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('fulfilled');
      });

      expect(result.current.data).toBe('test value');
    });

    it('does not resolve promise data until initialize is called', async () => {
      const promise = Promise.resolve('test');
      const { result } = renderHook(() => usePromise(promise));

      // Without initialize, the hook stays in unready state
      expect(result.current.status).toBe('unready');
      expect(result.current.data).toBeUndefined();

      // Even after waiting, still unready
      await new Promise((r) => setTimeout(r, 50));
      expect(result.current.status).toBe('unready');
    });
  });

  describe('with autorun', () => {
    it('auto-runs and resolves to fulfilled', async () => {
      const promise = Promise.resolve('auto value');
      const { result } = renderHook(() => usePromise(promise, true));

      // With autorun, the effect runs immediately and transitions through states
      await waitFor(() => {
        expect(result.current.status).toBe('fulfilled');
      });

      expect(result.current.data).toBe('auto value');
    });

    it('goes through pending state', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const { result } = renderHook(() => usePromise(promise, true));

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      act(() => {
        resolvePromise!('resolved');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('fulfilled');
      });
    });
  });

  describe('error handling', () => {
    it('transitions to rejected on promise rejection', async () => {
      const error = new Error('test error');
      const promise = Promise.reject(error);
      const { result } = renderHook(() => usePromise(promise, true));

      await waitFor(() => {
        expect(result.current.status).toBe('rejected');
      });

      expect(result.current.error).toBe(error);
    });

    it('clears error on re-initialize', async () => {
      let shouldReject = true;
      const createPromise = () =>
        shouldReject ? Promise.reject(new Error('error')) : Promise.resolve('success');

      const { result, rerender } = renderHook(({ promise }) => usePromise(promise, true), {
        initialProps: { promise: createPromise() },
      });

      await waitFor(() => {
        expect(result.current.status).toBe('rejected');
      });

      shouldReject = false;
      rerender({ promise: createPromise() });

      act(() => {
        result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('fulfilled');
      });

      expect(result.current.error).toBeUndefined();
    });
  });

  describe('re-initialization', () => {
    it('can re-run promise via initialize', async () => {
      let counter = 0;
      const createPromise = () => Promise.resolve(++counter);

      const { result, rerender } = renderHook(({ promise }) => usePromise(promise, true), {
        initialProps: { promise: createPromise() },
      });

      await waitFor(() => {
        expect(result.current.status).toBe('fulfilled');
      });

      expect(result.current.data).toBe(1);

      rerender({ promise: createPromise() });

      act(() => {
        result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.data).toBe(2);
      });
    });
  });
});
