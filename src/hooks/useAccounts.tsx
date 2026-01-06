import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { type LocalWallet, type Subaccount } from '@dydxprotocol/v4-client-js';
import { usePrivy } from '@privy-io/react-auth';
import { Keypair } from '@solana/web3.js';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import {
  ConnectorType,
  DydxAddress,
  PrivateInformation,
  WalletNetworkType,
} from '@/constants/wallets';

import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';

import { setOnboardingGuard, setOnboardingState } from '@/state/account';
import { getGeo } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setLocalWallet } from '@/state/wallet';
import { getSourceAccount } from '@/state/walletSelectors';

import { hdKeyManager, localWalletManager } from '@/lib/hdKeyManager';
import { onboardingManager } from '@/lib/onboarding/OnboardingSupervisor';
import { dydxPersistedWalletService } from '@/lib/wallet/dydxPersistedWalletService';

import { useCosmosWallets } from './useCosmosWallets';
import { useDydxClient } from './useDydxClient';
import { useEnvFeatures } from './useEnvFeatures';
import { useLocalStorage } from './useLocalStorage';
import useSignForWalletDerivation from './useSignForWalletDerivation';
import { useWalletConnection } from './useWalletConnection';

const AccountsContext = createContext<ReturnType<typeof useAccountsContext> | undefined>(undefined);

AccountsContext.displayName = 'Accounts';

export const AccountsProvider = ({ ...props }) => (
  <AccountsContext.Provider value={useAccountsContext()} {...props} />
);

export const useAccounts = () => useContext(AccountsContext)!;

const useAccountsContext = () => {
  const dispatch = useAppDispatch();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { endTurnkeySession } = useTurnkeyWallet();
  const { checkForGeo } = useEnvFeatures();
  const geo = useAppSelector(getGeo);

  // Wallet connection
  const {
    selectWallet,
    selectedWallet,
    selectedWalletError,
    signerWagmi,
    publicClientWagmi,
    getCosmosOfflineSigner,
    isConnectedGraz,
    dydxAccountGraz,
  } = useWalletConnection();

  const sourceAccount = useAppSelector(getSourceAccount);

  const { ready, authenticated } = usePrivy();

  const blockedGeo = useMemo(() => {
    return geo.currentlyGeoBlocked && checkForGeo;
  }, [geo, checkForGeo]);

  // dYdXClient Onboarding & Account Helpers
  const { indexerClient, getWalletFromSignature } = useDydxClient();
  // dYdX subaccounts
  const [dydxSubaccounts, setDydxSubaccounts] = useState<Subaccount[] | undefined>();

  const getSubaccounts = async ({ dydxAddress }: { dydxAddress: DydxAddress }) => {
    try {
      const response = await indexerClient?.account.getSubaccounts(dydxAddress);
      setDydxSubaccounts(response?.subaccounts);
      return response?.subaccounts ?? [];
    } catch (error) {
      // 404 is expected if the user has no subaccounts
      // 403 is expected if the user account is blocked
      const status = error.status ?? error.response?.status;
      if (status === 404 || status === 403) {
        return [];
      }
      throw error;
    }
  };

  // dYdX wallet / onboarding state
  const [localDydxWallet, setLocalDydxWallet] = useState<LocalWallet>();
  const [localNobleWallet, setLocalNobleWallet] = useState<LocalWallet>();
  const [localSolanaKeypair, setLocalSolanaKeypair] = useState<Keypair>();
  const [hdKey, setHdKey] = useState<PrivateInformation>();

  const dydxAccounts = useMemo(() => localDydxWallet?.accounts, [localDydxWallet]);

  const dydxAddress = useMemo(
    () => localDydxWallet?.address as DydxAddress | undefined,
    [localDydxWallet]
  );

  const canDeriveSolanaWallet = useMemo(() => {
    return sourceAccount.chain !== WalletNetworkType.Cosmos;
  }, [sourceAccount.chain]);

  const solanaAddress = useMemo(
    () => localSolanaKeypair?.publicKey.toBase58(),
    [localSolanaKeypair]
  );

  useEffect(() => {
    dispatch(setLocalWallet({ address: dydxAddress, solanaAddress, subaccountNumber: 0 }));
  }, [dispatch, dydxAddress, solanaAddress]);

  const setWalletFromTurnkeySignature = useCallback(
    async (signature: string) => {
      const { wallet, nobleWallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature(
        {
          signature,
        }
      );

      const key = { mnemonic, privateKey, publicKey };
      hdKeyManager.setHdkey(wallet.address, key);

      // Persist to SecureStorage for session restoration
      await dydxPersistedWalletService.secureStorePrivateKey(privateKey);

      setLocalDydxWallet(wallet);
      setLocalNobleWallet(nobleWallet);
      setHdKey(key);
      return wallet.address;
    },
    [getWalletFromSignature]
  );

  const signMessageAsync = useSignForWalletDerivation(sourceAccount.walletInfo);
  const hasLocalDydxWallet = Boolean(localDydxWallet);
  const cosmosWallets = useCosmosWallets(hdKey, getCosmosOfflineSigner);

  useEffect(() => {
    if (localDydxWallet && localNobleWallet && localSolanaKeypair) {
      localWalletManager.setLocalWallet(localDydxWallet, localNobleWallet, localSolanaKeypair);
    } else {
      localWalletManager.clearLocalWallet();
    }
  }, [localDydxWallet, localNobleWallet, localSolanaKeypair]);

  /**
   * Reconnect Side Effect - This is used to handle the reconnection flow when the user returns to the app.
   */
  useEffect(() => {
    (async () => {
      const result = await onboardingManager.handleWalletConnection({
        context: {
          sourceAccount,
          hasLocalDydxWallet,
          blockedGeo,
          isConnectedGraz,
          authenticated,
          ready,
        },
        getWalletFromSignature,
        signMessageAsync,
        getCosmosOfflineSigner,
        selectedDydxChainId,
      });

      // Handle the result
      if (result.wallet) {
        setLocalDydxWallet(result.wallet);
      }

      if (result.nobleWallet) {
        setLocalNobleWallet(result.nobleWallet);
      }

      if (result.solanaKeypair) {
        setLocalSolanaKeypair(result.solanaKeypair);
      }

      if (result.hdKey) {
        setHdKey(result.hdKey);
      }

      // Dispatch onboarding state
      dispatch(setOnboardingState(result.onboardingState));

      // Handle disconnected state
      if (result.onboardingState === OnboardingState.Disconnected && !result.wallet) {
        disconnectLocalDydxWallet();
      }
    })();
    // we don't want to re-run on `authenticated` or `ready` because this is for the Reconnection Flow
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    signMessageAsync,
    getCosmosOfflineSigner,
    getWalletFromSignature,
    selectedDydxChainId,
    signerWagmi,
    isConnectedGraz,
    sourceAccount,
    hasLocalDydxWallet,
    blockedGeo,
  ]);

  // clear subaccounts when no dydxAddress is set
  useEffect(() => {
    (async () => {
      if (!dydxAddress) {
        setDydxSubaccounts(undefined);
      }
    })();
  }, [dydxAddress]);

  // Onboarding conditions
  const [hasAcknowledgedTerms, saveHasAcknowledgedTerms] = useLocalStorage({
    key: LocalStorageKey.OnboardingHasAcknowledgedTerms,
    defaultValue: false,
  });

  useEffect(() => {
    dispatch(
      setOnboardingGuard({
        guard: OnboardingGuard.hasAcknowledgedTerms,
        value: hasAcknowledgedTerms,
      })
    );
  }, [dispatch, hasAcknowledgedTerms]);

  useEffect(() => {
    const hasPreviousTransactions = Boolean(dydxSubaccounts?.length);

    dispatch(
      setOnboardingGuard({
        guard: OnboardingGuard.hasPreviousTransactions,
        value: hasPreviousTransactions,
      })
    );
  }, [dispatch, dydxSubaccounts]);

  // Disconnect wallet / accounts
  const disconnectLocalDydxWallet = () => {
    // Clear persisted mnemonic from SecureStorage
    dydxPersistedWalletService.clearStoredWallet();

    setLocalDydxWallet(undefined);
    setHdKey(undefined);
    hdKeyManager.clearHdkey();
  };

  const disconnect = async () => {
    // Turnkey Signout
    if (sourceAccount.walletInfo?.connectorType === ConnectorType.Turnkey) {
      await endTurnkeySession();
    }

    // Disconnect local wallet
    disconnectLocalDydxWallet();
    selectWallet(undefined);
  };

  return {
    // Wallet connection
    sourceAccount,

    // Wallet selection
    selectWallet,
    selectedWallet,
    selectedWalletError,

    // Wallet connection (EVM)
    signerWagmi,
    publicClientWagmi,

    setWalletFromTurnkeySignature,

    // dYdX accounts
    hdKey,
    localDydxWallet,
    localNobleWallet,
    dydxAccounts,
    dydxAddress,
    setLocalDydxWallet,
    setLocalNobleWallet,
    setHdKey,

    // Cosmos wallets (on-demand)
    ...cosmosWallets,

    // Solana spot accounts
    solanaAddress,
    localSolanaKeypair,
    canDeriveSolanaWallet,

    // Onboarding state
    saveHasAcknowledgedTerms,

    // Disconnect wallet / accounts
    disconnect,

    // dydxClient Account methods
    getSubaccounts,

    // cosmos account
    dydxAccountGraz,
  };
};
