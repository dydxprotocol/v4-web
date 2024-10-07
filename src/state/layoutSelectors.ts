import { TradeLayouts } from '@/constants/layout';
import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';

import { store, type RootState } from './_store';
import { setSelectedTradeLayout } from './layout';

/**
 * @param state
 * @returns Boolean of whether the sidebar is open
 */
export const getIsSidebarOpen = (state: RootState) => state.layout.isSidebarOpen;

/**
 * @param state
 * @returns Currently selected TradeLayout and version
 */
export const getSelectedTradeLayout = (state: RootState): TradeLayouts => {
  const { version, layout } = state.layout.selectedTradeLayout;

  // Ensure version matches, otherwise wipe
  if (version !== LOCAL_STORAGE_VERSIONS[LocalStorageKey.SelectedTradeLayout]) {
    store.dispatch(setSelectedTradeLayout(TradeLayouts.Default));
    return TradeLayouts.Default;
  }
  return layout;
};
