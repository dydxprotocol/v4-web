import { useEffect, useState } from 'react';

export function useAwaited<T>(promised: Promise<T>): T | undefined;
export function useAwaited<T>(promised: Promise<T>, fallback: T): T;
export function useAwaited<T>(promised: Promise<T>, fallback?: T) {
  const [resolved, setResolved] = useState<T>();

  useEffect(() => {
    promised.then(setResolved);
  }, [promised]);

  return resolved ?? fallback;
}
