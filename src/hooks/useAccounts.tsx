import { useCallback, useContext, createContext, useEffect, useState, useMemo } from 'react';

import { NOBLE_BECH32_PREFIX, LocalWallet, type Subaccount } from '@dydxprotocol/v4-client-js';
import { AES, enc } from 'crypto-js';
import { useDispatch } from 'react-redux';

import { OnboardingGuard, OnboardingState, type EvmDerivedAddresses } from '@/constants/account';
import { DialogTypes } from '@/constants/dialogs';
import { LocalStorageKey, LOCAL_STORAGE_VERSIONS } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import {
  DydxAddress,
  EvmAddress,
  PrivateInformation,
  TEST_WALLET_EVM_ADDRESS,
  WalletType,
} from '@/constants/wallets';

import { setOnboardingState, setOnboardingGuard } from '@/state/account';
import { forceOpenDialog } from '@/state/dialogs';

import abacusStateManager from '@/lib/abacus';
import { log } from '@/lib/telemetry';
import { testFlags } from '@/lib/testFlags';

import { useDydxClient } from './useDydxClient';
import { useLocalStorage } from './useLocalStorage';
import { useRestrictions } from './useRestrictions';
import { useWalletConnection } from './useWalletConnection';
import { OfflineSigner } from '@cosmjs/proto-signing';

const AccountsContext = createContext<ReturnType<typeof useAccountsContext> | undefined>(undefined);

AccountsContext.displayName = 'Accounts';

export const AccountsProvider = ({ ...props }) => (
  <AccountsContext.Provider value={useAccountsContext()} {...props} />
);

export const useAccounts = () => useContext(AccountsContext)!;

const useAccountsContext = () => {
  const dispatch = useDispatch();

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
  }, [evmAddress]);

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
    evmAddress,
    dydxAddress,
  }: {
    evmAddress: EvmAddress;
    dydxAddress?: DydxAddress;
  }) => {
    saveEvmDerivedAddresses({
      ...evmDerivedAddresses,
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.EvmDerivedAddresses],
      [evmAddress]: {
        ...evmDerivedAddresses[evmAddress],
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
  const { compositeClient, getWalletFromEvmSignature } = useDydxClient();
  // dYdX subaccounts
  const [dydxSubaccounts, setDydxSubaccounts] = useState<Subaccount[] | undefined>();

  const { getSubaccounts } = useMemo(
    () => ({
      getSubaccounts: async ({ dydxAddress }: { dydxAddress: DydxAddress }) => {
        try {
          const response = await compositeClient?.indexerClient.account.getSubaccounts(dydxAddress);
          setDydxSubaccounts(response?.subaccounts);
          return response?.subaccounts ?? [];
        } catch (error) {
          // 404 is expected if the user has no subaccounts
          if (error.status === 404) {
            return [];
          } else {
            throw error;
          }
        }
      },
    }),
    [compositeClient]
  );

  // dYdX wallet / onboarding state
  const [localDydxWallet, setLocalDydxWallet] = useState<LocalWallet>();
  const [localNobleWallet, setLocalNobleWallet] = useState<LocalWallet>();
  const [hdKey, setHdKey] = useState<PrivateInformation>();

  const dydxAccounts = useMemo(() => localDydxWallet?.accounts, [localDydxWallet]);

  const dydxAddress = useMemo(
    () => localDydxWallet?.address as DydxAddress | undefined,
    [localDydxWallet]
  );

  const nobleAddress = useMemo(() => localNobleWallet?.address, [localNobleWallet]);

  const setWalletFromEvmSignature = async (signature: string) => {
    const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromEvmSignature({
      signature,
    });
    setLocalDydxWallet(wallet);
    setHdKey({ mnemonic, privateKey, publicKey });
  };

  useEffect(() => {
    if (evmAddress) {
      saveEvmDerivedAccount({ evmAddress, dydxAddress });
    }
  }, [evmAddress, dydxAddress]);

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
          evmAddress: TEST_WALLET_EVM_ADDRESS,
          dydxAddress: addressOverride,
        });
        const wallet = new LocalWallet();
        wallet.address = addressOverride;
        setLocalDydxWallet(wallet);

        dispatch(setOnboardingState(OnboardingState.AccountConnected));
      } else if (connectedDydxAddress && signerGraz) {
        dispatch(setOnboardingState(OnboardingState.WalletConnected));
        try {
          setLocalDydxWallet(await LocalWallet.fromOfflineSigner(signerGraz as OfflineSigner));
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        } catch (error) {
          log('useAccounts/setLocalDydxWallet', error);
        }
      } else if (evmAddress) {
        if (!localDydxWallet) {
          dispatch(setOnboardingState(OnboardingState.WalletConnected));

          const evmDerivedAccount = evmDerivedAddresses[evmAddress];

          if (evmDerivedAccount?.encryptedSignature) {
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
    if (dydxAddress) abacusStateManager.setAccount(localDydxWallet);
    else abacusStateManager.attemptDisconnectAccount();
  }, [localDydxWallet]);

  useEffect(() => {
    const setNobleWallet = async () => {
      if (hdKey?.mnemonic) {
        const nobleWallet = await LocalWallet.fromMnemonic(hdKey.mnemonic, NOBLE_BECH32_PREFIX);
        abacusStateManager.setNobleWallet(nobleWallet);
        setLocalNobleWallet(nobleWallet);
      }
    };
    setNobleWallet();
  }, [hdKey?.mnemonic]);

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
  }, [hasAcknowledgedTerms]);

  useEffect(() => {
    const hasPreviousTransactions = Boolean(dydxSubaccounts?.length);

    dispatch(
      setOnboardingGuard({
        guard: OnboardingGuard.hasPreviousTransactions,
        value: hasPreviousTransactions,
      })
    );
  }, [dydxSubaccounts]);

  // Restrictions
  const { isBadActor, sanctionedAddresses } = useRestrictions();

  useEffect(() => {
    if (
      dydxAddress &&
      (isBadActor ||
        sanctionedAddresses.has(dydxAddress) ||
        (evmAddress && sanctionedAddresses.has(evmAddress)))
    ) {
      dispatch(forceOpenDialog({ type: DialogTypes.RestrictedWallet }));
      disconnect();
    }
  }, [isBadActor, evmAddress, dydxAddress, sanctionedAddresses]);

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
