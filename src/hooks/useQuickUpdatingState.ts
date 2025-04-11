import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from 'lodash';

/*
  Creates local state that is updated immediately that pushes to global state in a debounced fashion
  If global state updates, we check against a small cache to see if it's an update we caused and ignore it if so, 
  otherwise we override local state with the incoming value.
*/
export function useQuickUpdatingState<T>({
  slowValue,
  setValueSlow,
  debounceMs = 500,
  cacheSize = 2,
}: {
  slowValue: T;
  setValueSlow: (val: T) => void;
  debounceMs?: number;
  cacheSize?: number;
}) {
  const [value, setValueState] = useState(slowValue);

  // Cache of recently sent values to check against incoming values
  const recentSlowValuesSentRef = useRef<Array<T>>([]);

  // Helper function to update the cache of sent values
  const updateSentValuesCache = useCallback(
    (newValue: T) => {
      const newCache = [...recentSlowValuesSentRef.current, newValue];
      // Only keep the most recent values up to cacheSize
      if (newCache.length > cacheSize) {
        newCache.shift();
      }
      recentSlowValuesSentRef.current = newCache;
    },
    [cacheSize]
  );

  // Helper function to set the slow value and update the cache
  const setSlowValueAndUpdateCache = useCallback(
    (newValue: T) => {
      updateSentValuesCache(newValue);
      setValueSlow(newValue);
    },
    [setValueSlow, updateSentValuesCache]
  );

  // Create a debounced version of the slow value setter
  const debouncedSetValueSlow = useMemo(
    () => debounce((v: T) => setSlowValueAndUpdateCache(v), debounceMs),
    [setSlowValueAndUpdateCache, debounceMs]
  );

  // Update the current value and schedule a slow update
  const setValue = useCallback(
    (newValue: T) => {
      // Update the instant value right away
      setValueState(newValue);

      // Use the debounced function for the slow update
      debouncedSetValueSlow(newValue);
    },
    [debouncedSetValueSlow]
  );

  // Force an immediate commit of the current value
  const commitValue = useCallback(
    (val: T) => {
      setValue(val);

      // Cancel pending debounced calls
      debouncedSetValueSlow.cancel();

      // Immediately send the current value
      setSlowValueAndUpdateCache(val);
    },
    [setValue, debouncedSetValueSlow, setSlowValueAndUpdateCache]
  );

  // Watch for changes to slowValue and update local state if needed
  useEffect(() => {
    // If this is a value we sent ourselves (exact reference match), ignore it
    const wasSentByUs = recentSlowValuesSentRef.current.some(
      (sentValue) => sentValue === slowValue
    );

    if (!wasSentByUs) {
      // If it's a new value from the external source, update our instant value
      setValueState(slowValue);
    }
  }, [slowValue]);

  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSetValueSlow.cancel();
    };
  }, [debouncedSetValueSlow]);

  return {
    value,
    setValue,
    commitValue,
  };
}
