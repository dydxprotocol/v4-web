import { PersistedState } from 'redux-persist';

type PersistAppStateV6 = PersistedState & {
  wallet: {
    sourceAccount: {
      address?: string;
      chain?: string;
      walletInfo?: any;
    };
  };
};

/**
 * Remove encrypted signatures from state
 * Users will need to reconnect and sign again
 * New signatures will be stored in SecureStorage instead
 */
export function migration6(state: PersistedState | undefined): PersistAppStateV6 {
  if (!state) throw new Error('state must be defined');

  const walletState = (state as any).wallet;

  return {
    ...state,
    wallet: {
      ...walletState,
      sourceAccount: {
        address: walletState?.sourceAccount?.address,
        chain: walletState?.sourceAccount?.chain,
        walletInfo: walletState?.sourceAccount?.walletInfo,
        // encryptedSignature removed - users will need to reconnect
      },
    },
  };
}
