import { TradeLayouts } from '@/constants/layout';
import type { RootState } from './_store';

/**
 * @param state
 * @returns Boolean of whether the sidebar is open
 */
export const getIsSidebarOpen = (state: RootState) => state.layout.isSidebarOpen;

/**
 * @param state
 * @returns Currently selected TradeLayout
 */
export const getSelectedTradeLayout = (state: RootState): TradeLayouts =>
  state.layout.selectedTradeLayout;
