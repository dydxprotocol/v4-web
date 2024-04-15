import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { LocalWallet, NOBLE_BECH32_PREFIX, type Subaccount } from '@dydxprotocol/v4-client-js';
import { usePrivy } from '@privy-io/react-auth';
import { AES, enc } from 'crypto-js';
import { useOfflineSigners as useOfflineSignersGraz } from 'graz';

import { OnboardingGuard, OnboardingState, type EvmDerivedAddresses } from '@/constants/account';
import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';
import {
  DydxAddress,
  EvmAddress,
  PrivateInformation,
  TEST_WALLET_EVM_ADDRESS,
  WalletConnectionType,
  WalletType,
} from '@/constants/wallets';

import { setOnboardingGuard, setOnboardingState } from '@/state/account';
import { getGeo, getHasSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { isBlockedGeo } from '@/lib/compliance';
import { getNobleChainId } from '@/lib/squid';
import { log } from '@/lib/telemetry';
import { testFlags } from '@/lib/testFlags';
import { sleep } from '@/lib/timeUtils';

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

  // Wallet connection
  const {
    walletType,
    walletConnectionType,
    selectWalletType,
    selectedWalletType,
    selectedWalletError,
    evmAddress,
    signerWagmi,
    publicClientWagmi,
    dydxAddress: connectedDydxAddress,
    signerGraz,
  } = useWalletConnection();

  // EVM wallet connection
  const [previousEvmAddress, setPreviousEvmAddress] = useState(evmAddress);
  const hasSubAccount = useAppSelector(getHasSubaccount);

  useEffect(() => {
    // Wallet accounts switched
    if (previousEvmAddress && evmAddress && evmAddress !== previousEvmAddress) {
      // Disconnect local wallet
      disconnectLocalDydxWallet();

      // Forget EVM signature
      forgetEvmSignature(previousEvmAddress);
    }

    if (evmAddress) {
      abacusStateManager.setTransfersSourceAddress(evmAddress);
    }

    setPreviousEvmAddress(evmAddress);
  }, [evmAddress, hasSubAccount]);

  const { ready, authenticated } = usePrivy();

  // EVM → dYdX account derivation

  const [evmDerivedAddresses, saveEvmDerivedAddresses] = useLocalStorage({
    key: LocalStorageKey.EvmDerivedAddresses,
    defaultValue: {} as EvmDerivedAddresses,
  });

  useEffect(() => {
    // Clear data stored with deprecated LocalStorageKey
    if (evmDerivedAddresses.version !== LOCAL_STORAGE_VERSIONS[LocalStorageKey.EvmDerivedAddresses])
      saveEvmDerivedAddresses({});
  }, []);

  const saveEvmDerivedAccount = ({
    evmAddressInner,
    dydxAddress,
  }: {
    evmAddressInner: EvmAddress;
    dydxAddress?: DydxAddress;
  }) => {
    saveEvmDerivedAddresses({
      ...evmDerivedAddresses,
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.EvmDerivedAddresses],
      [evmAddressInner]: {
        ...evmDerivedAddresses[evmAddressInner],
        dydxAddress,
      },
    });
  };

  const saveEvmSignature = useCallback(
    (encryptedSignature: string) => {
      evmDerivedAddresses[evmAddress!].encryptedSignature = encryptedSignature;
      saveEvmDerivedAddresses(evmDerivedAddresses);
    },
    [evmDerivedAddresses, evmAddress]
  );

  const forgetEvmSignature = useCallback(
    (_evmAddress = evmAddress) => {
      if (_evmAddress) {
        delete evmDerivedAddresses[_evmAddress]?.encryptedSignature;
        saveEvmDerivedAddresses(evmDerivedAddresses);
      }
    },
    [evmDerivedAddresses, evmAddress]
  );

  const decryptSignature = (encryptedSignature: string | undefined) => {
    const staticEncryptionKey = import.meta.env.VITE_PK_ENCRYPTION_KEY;

    if (!staticEncryptionKey) throw new Error('No decryption key found');
    if (!encryptedSignature) throw new Error('No signature found');

    const decrypted = AES.decrypt(encryptedSignature, staticEncryptionKey);
    const signature = decrypted.toString(enc.Utf8);
    return signature;
  };

  // dYdXClient Onboarding & Account Helpers
  const nobleChainId = getNobleChainId();
  const { indexerClient, getWalletFromEvmSignature } = useDydxClient();
  // dYdX subaccounts
  const [dydxSubaccounts, setDydxSubaccounts] = useState<Subaccount[] | undefined>();
  const { data: nobleSignerGraz } = useOfflineSignersGraz({
    chainId: nobleChainId,
  });

  const getSubaccounts = async ({ dydxAddress }: { dydxAddress: DydxAddress }) => {
    try {
      const response = await indexerClient.account.getSubaccounts(dydxAddress);
      setDydxSubaccounts(response?.subaccounts);
      return response?.subaccounts ?? [];
    } catch (error) {
      // 404 is expected if the user has no subaccounts
      // 403 is expected if the user account is blocked
      if (error.status === 404 || error.status === 403) {
        return [];
      }
      throw error;
    }
  };

  // dYdX wallet / onboarding state
  const [localDydxWallet, setLocalDydxWallet] = useState<LocalWallet>();
  const [localNobleWallet, setLocalNobleWallet] = useState<LocalWallet>();
  const [hdKey, setHdKey] = useState<PrivateInformation>();

  const dydxAccounts = useMemo(() => localDydxWallet?.accounts, [localDydxWallet]);

  const dydxAddress = useMemo(
    () => localDydxWallet?.address as DydxAddress | undefined,
    [localDydxWallet]
  );

  const nobleAddress = useMemo(() => {
    return localNobleWallet?.address;
  }, [localNobleWallet]);

  const setWalletFromEvmSignature = async (signature: string) => {
    const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromEvmSignature({
      signature,
    });
    setLocalDydxWallet(wallet);
    setHdKey({ mnemonic, privateKey, publicKey });
  };

  useEffect(() => {
    if (evmAddress) {
      saveEvmDerivedAccount({ evmAddressInner: evmAddress, dydxAddress });
    }
  }, [evmAddress, dydxAddress]);

  const signTypedDataAsync = useSignForWalletDerivation();

  useEffect(() => {
    (async () => {
      if (walletType === WalletType.TestWallet) {
        // Get override values. Use the testFlags value if it exists, otherwise use the previously
        // saved value where possible. If neither exist, use a default garbage value.
        const addressOverride: DydxAddress =
          (testFlags.addressOverride as DydxAddress) ||
          (evmDerivedAddresses?.[TEST_WALLET_EVM_ADDRESS]?.dydxAddress as DydxAddress) ||
          'dydx1';

        dispatch(setOnboardingState(OnboardingState.WalletConnected));

        // Set variables.
        saveEvmDerivedAccount({
          evmAddressInner: TEST_WALLET_EVM_ADDRESS,
          dydxAddress: addressOverride,
        });
        const wallet = new LocalWallet();
        wallet.address = addressOverride;
        setLocalDydxWallet(wallet);

        dispatch(setOnboardingState(OnboardingState.AccountConnected));
      } else if (connectedDydxAddress && signerGraz) {
        dispatch(setOnboardingState(OnboardingState.WalletConnected));
        try {
          setLocalDydxWallet(await LocalWallet.fromOfflineSigner(signerGraz.offlineSigner));
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        } catch (error) {
          log('useAccounts/setLocalDydxWallet', error);
        }
      } else if (evmAddress) {
        if (!localDydxWallet) {
          dispatch(setOnboardingState(OnboardingState.WalletConnected));

          const evmDerivedAccount = evmDerivedAddresses[evmAddress];

          if (walletConnectionType === WalletConnectionType.Privy && authenticated && ready) {
            try {
              // Give Privy a second to finish the auth flow before getting the signature
              await sleep();
              const signature = await signTypedDataAsync();

              await setWalletFromEvmSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              forgetEvmSignature();
            }
          } else if (evmDerivedAccount?.encryptedSignature) {
            try {
              const signature = decryptSignature(evmDerivedAccount.encryptedSignature);

              await setWalletFromEvmSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              forgetEvmSignature();
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
  }, [evmAddress, evmDerivedAddresses, signerWagmi, connectedDydxAddress, signerGraz]);

  // abacus
  useEffect(() => {
    if (dydxAddress) abacusStateManager.setAccount(localDydxWallet, hdKey);
    else abacusStateManager.attemptDisconnectAccount();
  }, [localDydxWallet, hdKey]);

  useEffect(() => {
    const setNobleWallet = async () => {
      let nobleWallet: LocalWallet | undefined;
      if (hdKey?.mnemonic) {
        nobleWallet = await LocalWallet.fromMnemonic(hdKey.mnemonic, NOBLE_BECH32_PREFIX);
      }
      if (nobleSignerGraz !== undefined) {
        nobleWallet = await LocalWallet.fromOfflineSigner(nobleSignerGraz.offlineSigner);
      }

      if (nobleWallet !== undefined) {
        abacusStateManager.setNobleWallet(nobleWallet);
        setLocalNobleWallet(nobleWallet);
      }
    };
    setNobleWallet();
  }, [hdKey?.mnemonic, nobleSignerGraz]);

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
    if (geo && isBlockedGeo(geo) && checkForGeo) {
      disconnect();
    }
  }, [checkForGeo, geo]);

  // Disconnect wallet / accounts
  const disconnectLocalDydxWallet = () => {
    setLocalDydxWallet(undefined);
    setHdKey(undefined);
  };

  const disconnect = async () => {
    // Disconnect local wallet
    disconnectLocalDydxWallet();

    // Disconnect EVM wallet
    forgetEvmSignature();
    selectWalletType(undefined);
  };

  return {
    // Wallet connection
    walletType,
    walletConnectionType,

    // Wallet selection
    selectWalletType,
    selectedWalletType,
    selectedWalletError,

    // Wallet connection (EVM)
    evmAddress,
    signerWagmi,
    publicClientWagmi,

    // Wallet connection (Cosmos)
    signerGraz,

    // EVM → dYdX account derivation
    setWalletFromEvmSignature,
    saveEvmSignature,
    forgetEvmSignature,

    // dYdX accounts
    hdKey,
    localDydxWallet,
    dydxAccounts,
    dydxAddress,
    nobleAddress,

    // Onboarding state
    saveHasAcknowledgedTerms,

    // Disconnect wallet / accounts
    disconnect,

    // dydxClient Account methods
    getSubaccounts,
  };
};
