import {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
  UseBaseQueryOptions,
  notifyManager,
} from '@tanstack/react-query';

import hookifyHooks from './vanillaHooks';

// This file is very similar to the one from the react-query codebase but changed to always use hookify hooks rather than react
// sadly, this will probably need to be updated when we bump react-query major versions
export const getUseBaseQuery =
  (client: QueryClient, Observer: typeof QueryObserver) =>
  <TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(
    options: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  ): QueryObserverResult<TData, TError> => {
    const defaultedOptions = client.defaultQueryOptions(options);

    // Make sure results are optimistically set in fetching state before subscribing or updating options
    defaultedOptions._optimisticResults = 'optimistic';

    const [observer] = hookifyHooks.useState(
      () =>
        new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(client, defaultedOptions)
    );

    const result = observer.getOptimisticResult(defaultedOptions);

    hookifyHooks.useSyncExternalStore(
      hookifyHooks.useCallback(
        (onStoreChange) => {
          const unsubscribe = observer.subscribe(notifyManager.batchCalls(onStoreChange));

          // Update result to make sure we did not miss any query updates
          // between creating the observer and subscribing to it.
          observer.updateResult();

          return unsubscribe;
        },
        [observer]
      ),
      () => observer.getCurrentResult()
    );

    hookifyHooks.useEffect(() => {
      // Do not notify on updates because of changes in the options because
      // these changes should already be reflected in the optimistic result.
      observer.setOptions(defaultedOptions, { listeners: false });
    }, [defaultedOptions, observer]);

    // Handle result property usage tracking
    return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
  };
