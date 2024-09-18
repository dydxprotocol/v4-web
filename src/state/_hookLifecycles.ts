import {
  loadedVaultAccount,
  loadedVaultDetails,
  loadedVaultPositions,
  vaultFormSlippage,
  vaultFormValidation,
} from './vaultsLifecycle';

// only hooked selectors which are not subscribed to via other means are required here
// so anything these depend on will be initialized when these initialize
const allTopLevelHookedSelectors = [
  loadedVaultDetails,
  loadedVaultPositions,
  loadedVaultAccount,
  vaultFormSlippage,
  vaultFormValidation,
];

export const initHookLifecycles = () => allTopLevelHookedSelectors.forEach((hs) => hs.start());
