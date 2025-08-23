import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { BonsaiCore } from '@/bonsai/ontology';
import { type Subaccount } from '@dydxprotocol/v4-client-js';
import { usePrivy } from '@privy-io/react-auth';
import { AES, enc } from 'crypto-js';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import {
  ConnectorType,
  DydxAddress,
  PrivateInformation,
  WalletNetworkType,
} from '@/constants/wallets';

import { setOnboardingGuard, setOnboardingState } from '@/state/account';
import { getGeo } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { clearSavedEncryptedSignature, setLocalWallet } from '@/state/wallet';
import { getSourceAccount } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { hdKeyManager, localWalletManager } from '@/lib/hdKeyManager';
import { log } from '@/lib/telemetry';
import { sleep } from '@/lib/timeUtils';

import { useDydxClient } from './useDydxClient';
import { useEnvFeatures } from './useEnvFeatures';
import { useFuelWallet } from './useFuelWallet';
import { useLocalStorage } from './useLocalStorage';
import useSignForWalletDerivation from './useSignForWalletDerivation';

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

  // Wallet connection
  const {
    fuel,
    isConnected: isConnectedFuel,
    address: fuelAddress,
    error: selectedWalletError,
    connect: selectWallet,
    disconnect: disconnectFuel,
  } = useFuelWallet();

  const hasSubAccount = useAppSelector(BonsaiCore.account.parentSubaccountSummary.data) != null;
  const sourceAccount = useAppSelector(getSourceAccount);

  // Debug: Log current onboarding state
  const onboardingState = useAppSelector((state) => state.account.onboardingState);

  // Auto-set onboarding state to AccountConnected when Fuel wallet connects
  useEffect(() => {
    if (isConnectedFuel && fuelAddress) {
      if (onboardingState === OnboardingState.WalletConnected || onboardingState === OnboardingState.Disconnected) {
        dispatch(setOnboardingState(OnboardingState.AccountConnected));
      }
    } else if (!isConnectedFuel && onboardingState !== OnboardingState.Disconnected) {
      // If Fuel wallet is disconnected but onboarding state is not Disconnected, reset it
      dispatch(setOnboardingState(OnboardingState.Disconnected));
    }
  }, [isConnectedFuel, fuelAddress, onboardingState, dispatch]);

  const { ready, authenticated } = usePrivy();

  const blockedGeo = useMemo(() => {
    return geo != null && isBlockedGeo(geo) && checkForGeo;
  }, [geo, checkForGeo]);

  const [previousAddress, setPreviousAddress] = useState(sourceAccount.address);
  useEffect(() => {
    const { address } = sourceAccount;
    // wallet accounts switched
    if (previousAddress && address !== previousAddress) {
      // Disconnect local wallet
      disconnectLocalDydxWallet();
    }

    setPreviousAddress(address);
    // We only want to set the source wallet address if the address changes
    // OR when our connection state changes.
    // The address can be cached via local storage, so it won't change when we reconnect
    // But the hasSubAccount value will become true once you reconnect
    // This allows us to trigger a state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceAccount.address, sourceAccount.chain, hasSubAccount]);

  const decryptSignature = (encryptedSignature: string | undefined) => {
    const staticEncryptionKey = import.meta.env.VITE_PK_ENCRYPTION_KEY;

    if (!staticEncryptionKey) throw new Error('No decryption key found');
    if (!encryptedSignature) throw new Error('No signature found');

    const decrypted = AES.decrypt(encryptedSignature, staticEncryptionKey);
    const signature = decrypted.toString(enc.Utf8);
    return signature;
  };

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
  // Disconnect wallet / accounts - moved up to fix order
  const disconnectLocalDydxWallet = () => {
    setLocalDydxWallet(undefined);
    setHdKey(undefined);
    hdKeyManager.clearHdkey();
  };

  const [localDydxWallet, setLocalDydxWallet] = useState<any>();
  const [localNobleWallet, setLocalNobleWallet] = useState<any>();
  const [localOsmosisWallet, setLocalOsmosisWallet] = useState<any>();
  const [localNeutronWallet, setLocalNeutronWallet] = useState<any>();

  const [hdKey, setHdKey] = useState<PrivateInformation>();

  const dydxAccounts = useMemo(() => localDydxWallet?.accounts, [localDydxWallet]);

  const dydxAddress = useMemo(
    () => localDydxWallet?.address as DydxAddress | undefined,
    [localDydxWallet]
  );

  useEffect(() => {
    dispatch(setLocalWallet({ address: dydxAddress, subaccountNumber: 0 }));
  }, [dispatch, dydxAddress]);

  const nobleAddress = localNobleWallet?.address;
  const osmosisAddress = localOsmosisWallet?.address;
  const neutronAddress = localNeutronWallet?.address;

  const setWalletFromSignature = useCallback(
    async (signature: string) => {
      const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature({
        signature,
      });
      const key = { mnemonic, privateKey, publicKey };
      hdKeyManager.setHdkey(wallet.address, key);
      setLocalDydxWallet(wallet);
      setHdKey(key);
    },
    [getWalletFromSignature]
  );

  const signMessageAsync = useSignForWalletDerivation(sourceAccount.walletInfo);

  const hasLocalDydxWallet = Boolean(localDydxWallet);

  useEffect(() => {
    if (localDydxWallet && localNobleWallet) {
      localWalletManager.setLocalWallet(localDydxWallet, localNobleWallet);
    } else {
      localWalletManager.clearLocalWallet();
    }
  }, [localDydxWallet, localNobleWallet]);

  useEffect(() => {
    (async () => {
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.Test) {
        dispatch(setOnboardingState(OnboardingState.WalletConnected));
        const wallet = new (await getLazyLocalWallet())();
        wallet.address = sourceAccount.address;
        setLocalDydxWallet(wallet);
        dispatch(setOnboardingState(OnboardingState.AccountConnected));
      } else if (sourceAccount.chain === WalletNetworkType.Evm) {
        if (!hasLocalDydxWallet) {
          dispatch(setOnboardingState(OnboardingState.WalletConnected));

          if (
            sourceAccount.walletInfo?.connectorType === ConnectorType.Privy &&
            authenticated &&
            ready
          ) {
            try {
              // Give Privy a second to finish the auth flow before getting the signature
              await sleep();
              const signature = await signMessageAsync();

              await setWalletFromSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              dispatch(clearSavedEncryptedSignature());
            }
          } else if (sourceAccount.encryptedSignature && !blockedGeo) {
            try {
              const signature = decryptSignature(sourceAccount.encryptedSignature);

              await setWalletFromSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              dispatch(clearSavedEncryptedSignature());
            }
          }
        } else {
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        }
      } else if (sourceAccount.chain === WalletNetworkType.Solana) {
        if (!hasLocalDydxWallet) {
          dispatch(setOnboardingState(OnboardingState.WalletConnected));

          if (sourceAccount.encryptedSignature && !blockedGeo) {
            try {
              const signature = decryptSignature(sourceAccount.encryptedSignature);
              await setWalletFromSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              dispatch(clearSavedEncryptedSignature());
            }
          }
        } else {
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        }
      } else {
        disconnectLocalDydxWallet();
        dispatch(setOnboardingState(OnboardingState.Disconnected));
      }
    })();
  }, [isConnectedFuel, sourceAccount, hasLocalDydxWallet, blockedGeo]);



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



  const disconnect = async () => {
    // Disconnect local wallet
    disconnectLocalDydxWallet();
    disconnectFuel();
  };

  // Mock localDydxWallet for Fuel wallet to satisfy subaccount system requirements
  const mockLocalDydxWallet = useMemo(() => {
    if (isConnectedFuel && fuelAddress) {
      return {
        address: fuelAddress,
        accounts: [{ address: fuelAddress, pubkey: new Uint8Array(0), algo: 'secp256k1' }],
        pubKey: { type: 'tendermint/PubKeySecp256k1', value: '' },
        signer: undefined,
        offlineSigner: undefined,
      } as any; // Type assertion to avoid import issues
    }
    return localDydxWallet;
  }, [isConnectedFuel, fuelAddress, localDydxWallet]);

  return {
    // Wallet connection
    sourceAccount,
    localNobleWallet,

    // Wallet selection
    selectWallet,
    selectedWalletError,

    // Wallet connection (Fuel)
    fuel,
    isConnected: isConnectedFuel,
    address: fuelAddress,

    setWalletFromSignature,

    // dYdX accounts
    hdKey,
    localDydxWallet: mockLocalDydxWallet,
    dydxAccounts,
    dydxAddress,

    nobleAddress,
    osmosisAddress,
    neutronAddress,

    // Onboarding state
    saveHasAcknowledgedTerms,

    // Disconnect wallet / accounts
    disconnect,

    // dydxClient Account methods
    getSubaccounts,
  };
};
