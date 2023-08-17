import { useCallback, useContext, createContext, useEffect, useState, useMemo } from 'react';

import { useDispatch } from 'react-redux';
import { AES, enc } from 'crypto-js';
import { LocalWallet, USDC_DENOM, type Subaccount } from '@dydxprotocol/v4-client';

import { SubAccountHistoricalPNLs } from '@/constants/abacus';
import { OnboardingGuard, OnboardingState, type EvmDerivedAddresses } from '@/constants/account';
import { LocalStorageKey, LOCAL_STORAGE_VERSIONS } from '@/constants/localStorage';
import { DydxAddress, EthereumAddress, PrivateInformation } from '@/constants/wallets';

import {
  setOnboardingState,
  setOnboardingGuard,
  setSubaccount,
  setHistoricalPnl,
} from '@/state/account';

import abacusStateManager from '@/lib/abacus';
import { log } from '@/lib/telemetry';

import { useLocalStorage } from './useLocalStorage';

import { useWalletConnection } from './useWalletConnection';
import { useDydxClient } from './useDydxClient';

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
    evmAddress: EthereumAddress;
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

  const { getAccountBalance, getSubaccounts } = useMemo(
    () => ({
      getAccountBalance: async ({
        dydxAddress,
        denom = USDC_DENOM,
      }: {
        dydxAddress: DydxAddress;
        denom?: string;
      }) => await compositeClient?.validatorClient.get.getAccountBalance(dydxAddress, denom),

      getSubaccounts: async ({ dydxAddress }: { dydxAddress: DydxAddress }) => {
        try {
          const response = await compositeClient?.indexerClient.account.getSubaccounts(dydxAddress);
          setDydxSubaccounts(response.subaccounts);
          return response.subaccounts;
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
  const [hdKey, setHdKey] = useState<PrivateInformation>();

  const dydxAccounts = useMemo(() => localDydxWallet?.accounts, [localDydxWallet]);

  const dydxAddress = useMemo(
    () => localDydxWallet?.address as DydxAddress | undefined,
    [localDydxWallet]
  );

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
      if (connectedDydxAddress && signerGraz) {
        dispatch(setOnboardingState(OnboardingState.WalletConnected));
        try {
          setLocalDydxWallet(await LocalWallet.fromOfflineSigner(signerGraz));
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        } catch (error) {
          log('useAccounts/setLocalDydxWallet', error);
        }
      } else if (evmAddress && signerWagmi) {
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
  // TODO: useAbacus({ dydxAddress })
  useEffect(() => {
    if (dydxAddress) abacusStateManager.setAccount(dydxAddress);
    else abacusStateManager.disconnectAccount();
  }, [dydxAddress]);

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

    // Onboarding state
    saveHasAcknowledgedTerms,

    // Disconnect wallet / accounts
    disconnect,

    // dydxClient Account methods
    getAccountBalance,
    getSubaccounts,
  };
};
