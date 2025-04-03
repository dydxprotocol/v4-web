import { prepareAutoBatched } from '@reduxjs/toolkit';
import { mapValues } from 'lodash';

export function autoBatchAllReducers<State>() {
  return <R extends Record<string, (state: State, action: any) => void>>(reducers: R) => {
    type TransformedReducers = {
      [K in keyof R]: {
        reducer: R[K];
        prepare: ReturnType<
          typeof prepareAutoBatched<
            Parameters<R[K]>['length'] extends 0 | 1 ? void : Parameters<R[K]>[1]['payload']
          >
        >;
      };
    };

    return mapValues(reducers, (reducer) => ({
      reducer,
      prepare: prepareAutoBatched<any>(),
    })) as TransformedReducers;
  };
}
