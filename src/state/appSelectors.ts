import type { RootState } from './_store';

export const getApiState = (state: RootState) => state.app.apiState;
export const getSelectedNetwork = (state: RootState) => state.app.selectedNetwork;
