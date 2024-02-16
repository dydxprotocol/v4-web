import { type DydxNetwork, ENVIRONMENT_CONFIG_MAP, type DydxChainId } from '@/constants/networks';

export const validateAgainstAvailableEnvironments = (value: DydxNetwork) =>
  Object.keys(ENVIRONMENT_CONFIG_MAP).includes(value);

export const getDydxChainIdFromNetwork = (network: DydxNetwork) => {
  return ENVIRONMENT_CONFIG_MAP[network].dydxChainId as DydxChainId;
};
