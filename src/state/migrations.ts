import { createMigrate, PersistedState, PersistMigrate } from 'redux-persist';
import { MigrationConfig } from 'redux-persist/lib/createMigrate';

import { migration0 } from './migrations/0';

export const migrations = {
  0: migration0,
} as const;

/*
  By default, redux-persist skips migrations for users who don't already have a persisted store.
  This custom `createMigrate` forces users without data to start at version -1 and run through all the migrations
  anyway, since migrations contain logic to move over from our legacy localStorage data formats
*/
export function customCreateMigrate(options: MigrationConfig): PersistMigrate {
  const defaultMigrate = createMigrate(migrations, options);
  return async (state: PersistedState, currentVersion: number) => {
    if (state !== undefined) {
      return defaultMigrate(state, currentVersion);
    }

    const initializedState = {
      // Begin everyone at version -1 so that they receive all migrations that deprecate legacy data
      _persist: { version: -1, rehydrated: true },
    };

    return defaultMigrate(initializedState, currentVersion);
  };
}
