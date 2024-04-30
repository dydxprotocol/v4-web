import { ENVIRONMENT_CONFIG_MAP, type DydxNetwork } from '@/constants/networks';

export const validateAgainstAvailableEnvironments = (value: DydxNetwork) =>
  Object.keys(ENVIRONMENT_CONFIG_MAP).includes(value);
