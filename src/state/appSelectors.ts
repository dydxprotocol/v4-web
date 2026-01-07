import { DydxChainId, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import type { RootState } from './_store';

export const getSelectedNetwork = (state: RootState) => state.app.selectedNetwork;
export const getInitializationError = (state: RootState) => state.app.initializationError;
export const getCurrentPath = (state: RootState) => state.app.currentPath;

export const getSelectedDydxChainId = (state: RootState) =>
  ENVIRONMENT_CONFIG_MAP[state.app.selectedNetwork].dydxChainId as DydxChainId;

export const getMetadataEndpoint = (state: RootState) =>
  ENVIRONMENT_CONFIG_MAP[getSelectedNetwork(state)].endpoints.metadataService;

export const getSpotApiEndpoint = (state: RootState) =>
  ENVIRONMENT_CONFIG_MAP[getSelectedNetwork(state)].endpoints.spotApi;

export const getGeoCheckEnabled = (state: RootState) =>
  ENVIRONMENT_CONFIG_MAP[getSelectedNetwork(state)].featureFlags.checkForGeo;
