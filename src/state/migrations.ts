import { createMigrate, MigrationManifest, PersistedState, PersistMigrate } from 'redux-persist';
import { MigrationConfig } from 'redux-persist/lib/createMigrate';

import { LocalStorageKey } from '@/constants/localStorage';

function parseStorageItem(data: string | null) {
  if (!data) return undefined;

  try {
    return JSON.parse(data);
  } catch (_) {
    return undefined;
  }
}

export function customCreateMigrate(
  migrations: MigrationManifest,
  options: MigrationConfig
): PersistMigrate {
  const defaultMigrate = createMigrate(migrations, options);
  return async (state: PersistedState, currentVersion: number) => {
    if (state !== undefined) {
      return defaultMigrate(state, currentVersion);
    }

    // Get all old localStorage items here
    const oldTvChartConfig = parseStorageItem(
      localStorage.getItem(LocalStorageKey.TradingViewChartConfig)
    );

    // Remove (now) unused localStorage items
    localStorage.removeItem(LocalStorageKey.TradingViewChartConfig);

    const initializedState = {
      tradingView: {
        chartConfig: oldTvChartConfig,
      },
      _persist: { version: 0, rehydrated: true },
    };

    return defaultMigrate(initializedState, currentVersion);
  };
}
