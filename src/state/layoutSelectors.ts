import type { RootState } from './_store';

/**
 * @param state
 * @returns Boolean of whether the sidebar is open
 */
export const getIsSidebarOpen = (state: RootState) => state.layout.isSidebarOpen;
