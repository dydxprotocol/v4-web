import { DydxChainId, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import type { RootState } from './_store';

export const getApiState = (state: RootState) => state.app.apiState;
export const getSelectedNetwork = (state: RootState) => state.app.selectedNetwork;

export const getSelectedDydxChainId = (state: RootState) =>
  ENVIRONMENT_CONFIG_MAP[state.app.selectedNetwork].dydxChainId as DydxChainId;
