import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { type LocalWallet, type Subaccount } from '@dydxprotocol/v4-client-js';
import { usePrivy } from '@privy-io/react-auth';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import { ConnectorType, DydxAddress, PrivateInformation } from '@/constants/wallets';

import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';

import { setOnboardingGuard, setOnboardingState } from '@/state/account';
import { getGeo } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setLocalWallet } from '@/state/wallet';
import { getSourceAccount } from '@/state/walletSelectors';

import { hdKeyManager, localWalletManager } from '@/lib/hdKeyManager';
import { onboardingManager } from '@/lib/onboarding/OnboardingSupervisor';
import { dydxWalletService } from '@/lib/wallet/dydxWalletService';

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
  const geo = useAppSelector(getGeo);
  const { checkForGeo } = useEnvFeatures();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { endTurnkeySession } = useTurnkeyWallet();

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
  const [hdKey, setHdKey] = useState<PrivateInformation>();

  const dydxAccounts = useMemo(() => localDydxWallet?.accounts, [localDydxWallet]);

  const dydxAddress = useMemo(
    () => localDydxWallet?.address as DydxAddress | undefined,
    [localDydxWallet]
  );

  useEffect(() => {
    dispatch(setLocalWallet({ address: dydxAddress, subaccountNumber: 0 }));
  }, [dispatch, dydxAddress]);

  const setWalletFromTurnkeySignature = useCallback(
    async (signature: string) => {
      const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature({
        signature,
      });

      const key = { mnemonic, privateKey, publicKey };
      hdKeyManager.setHdkey(wallet.address, key);

      // Persist to SecureStorage for session restoration
      await dydxWalletService.deriveFromSignature(signature);

      setLocalDydxWallet(wallet);
      setHdKey(key);
      return wallet.address;
    },
    [getWalletFromSignature]
  );

  const signMessageAsync = useSignForWalletDerivation(sourceAccount.walletInfo);
  const hasLocalDydxWallet = Boolean(localDydxWallet);
  const cosmosWallets = useCosmosWallets(hdKey, getCosmosOfflineSigner);

  useEffect(() => {
    if (localDydxWallet && hdKey) {
      localWalletManager.setLocalWallet(localDydxWallet, hdKey);
    } else {
      localWalletManager.clearLocalWallet();
    }
  }, [localDydxWallet, hdKey]);

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
  }, [signerWagmi, isConnectedGraz, sourceAccount, hasLocalDydxWallet, blockedGeo]);

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

  useEffect(() => {
    if (blockedGeo) {
      disconnect();
    }
  }, [blockedGeo]);

  // Disconnect wallet / accounts
  const disconnectLocalDydxWallet = () => {
    // Clear persisted mnemonic from SecureStorage
    dydxWalletService.clearStoredWallet();

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
    dydxAccounts,
    dydxAddress,
    setLocalDydxWallet,
    setHdKey,

    // Cosmos wallets (on-demand)
    ...cosmosWallets,

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
