import { createMigrate, MigrationManifest, PersistedState, PersistMigrate } from 'redux-persist';
import { MigrationConfig } from 'redux-persist/lib/createMigrate';

import { migration0 } from './migrations/0';
import { migration1 } from './migrations/1';
import { migration2 } from './migrations/2';
import { migration3 } from './migrations/3';
import { migration4 } from './migrations/4';

function migrate<V, V2>(state: PersistedState, migration: (persistedState: V) => V2): V2 {
  const persistedState = state as V;
  const migratedState = migration(persistedState);
  return migratedState;
}

export const migrations: MigrationManifest = {
  0: migration0,
  1: migration1,
  2: migration2,
  3: migration3,
  4: (state: PersistedState) => migrate(state, migration4),
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
