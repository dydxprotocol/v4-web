import { type DydxNetwork, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

export const validateAgainstAvailableEnvironments = (value: DydxNetwork) =>
  Object.keys(ENVIRONMENT_CONFIG_MAP).includes(value);
