import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { LocalWallet, NOBLE_BECH32_PREFIX, type Subaccount } from '@dydxprotocol/v4-client-js';
import { usePrivy } from '@privy-io/react-auth';
import { AES, enc } from 'crypto-js';

import {
  EvmDerivedAddresses,
  OnboardingGuard,
  OnboardingState,
  SolDerivedAddresses,
} from '@/constants/account';
import { getNobleChainId } from '@/constants/graz';
import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';
import {
  ConnectorType,
  DydxAddress,
  EvmAddress,
  PrivateInformation,
  SolAddress,
  TEST_WALLET_EVM_ADDRESS,
} from '@/constants/wallets';

import { setOnboardingGuard, setOnboardingState } from '@/state/account';
import { getGeo, getHasSubaccount } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { isBlockedGeo } from '@/lib/compliance';
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
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  // Wallet connection
  const {
    connectedWallet,
    selectWallet,
    selectedWallet,
    selectedWalletError,
    evmAddress,
    solAddress,
    signerWagmi,
    publicClientWagmi,
    dydxAddress: connectedDydxAddress,
    getCosmosOfflineSigner,
    isConnectedGraz,
    dydxAccountGraz,
  } = useWalletConnection();

  // EVM wallet connection
  const [previousEvmAddress, setPreviousEvmAddress] = useState(evmAddress);
  const hasSubAccount = useAppSelector(getHasSubaccount);

  useEffect(() => {
    // EVM Wallet accounts switched
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

  const [previousSolAddress, setPreviousSolAddress] = useState(solAddress);

  // EVM → dYdX account derivation
  const [evmDerivedAddresses, saveEvmDerivedAddresses] = useLocalStorage({
    key: LocalStorageKey.EvmDerivedAddresses,
    defaultValue: { version: 'v2' } as EvmDerivedAddresses,
  });

  useEffect(() => {
    // Clear data stored with deprecated LocalStorageKey
    if (evmDerivedAddresses.version !== LOCAL_STORAGE_VERSIONS[LocalStorageKey.EvmDerivedAddresses])
      saveEvmDerivedAddresses({
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.EvmDerivedAddresses],
      });
  }, []);

  const saveEvmDerivedAccount = useCallback(
    ({
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
          ...(evmDerivedAddresses as any)[evmAddressInner],
          dydxAddress,
        },
      });
    },
    [evmDerivedAddresses]
  );

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
    [evmAddress, evmDerivedAddresses]
  );

  // SOL → dYdX account derivation
  const [solDerivedAddresses, saveSolDerivedAddresses] = useLocalStorage({
    key: LocalStorageKey.SolDerivedAddresses,
    defaultValue: {} as SolDerivedAddresses,
  });

  const saveSolDerivedAccount = useCallback(
    ({
      solAddressInner,
      dydxAddress,
    }: {
      solAddressInner: SolAddress;
      dydxAddress?: DydxAddress;
    }) => {
      saveSolDerivedAddresses({
        ...solDerivedAddresses,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.SolDerivedAddresses],
        [solAddressInner]: {
          ...solDerivedAddresses[solAddressInner],
          dydxAddress,
        },
      });
    },
    [saveSolDerivedAddresses, solDerivedAddresses]
  );

  const saveSolSignature = useCallback(
    (encryptedSignature: string) => {
      solDerivedAddresses[solAddress!].encryptedSignature = encryptedSignature;
      saveSolDerivedAddresses(solDerivedAddresses);
    },
    [solDerivedAddresses, solAddress, saveSolDerivedAddresses]
  );

  const forgetSolSignature = useCallback(
    (_solAddress = solAddress) => {
      if (_solAddress) {
        delete solDerivedAddresses[_solAddress]?.encryptedSignature;
        saveSolDerivedAddresses(solDerivedAddresses);
      }
    },
    [solAddress, solDerivedAddresses, saveSolDerivedAddresses]
  );

  useEffect(() => {
    // SOL Wallet accounts switched
    if (previousSolAddress && solAddress && solAddress !== previousSolAddress) {
      // Disconnect local wallet
      disconnectLocalDydxWallet();

      // Forget SOL signature
      forgetSolSignature(previousSolAddress);
    }

    if (solAddress) {
      abacusStateManager.setTransfersSourceAddress(solAddress);
    }

    setPreviousSolAddress(solAddress);
  }, [solAddress]);

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
  const { indexerClient, getWalletFromSignature } = useDydxClient();
  // dYdX subaccounts
  const [dydxSubaccounts, setDydxSubaccounts] = useState<Subaccount[] | undefined>();

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

  const setWalletFromSignature = useCallback(
    async (signature: string) => {
      const { wallet, mnemonic, privateKey, publicKey } = await getWalletFromSignature({
        signature,
      });
      setLocalDydxWallet(wallet);
      setHdKey({ mnemonic, privateKey, publicKey });
    },
    [getWalletFromSignature]
  );

  useEffect(() => {
    if (evmAddress) {
      saveEvmDerivedAccount({ evmAddressInner: evmAddress, dydxAddress });
    }
  }, [evmAddress, dydxAddress]);

  useEffect(() => {
    if (solAddress) {
      saveSolDerivedAccount({ solAddressInner: solAddress, dydxAddress });
    }
  }, [solAddress, dydxAddress]);

  const signMessageAsync = useSignForWalletDerivation(connectedWallet);

  useEffect(() => {
    (async () => {
      if (connectedWallet?.connectorType === ConnectorType.Test) {
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
      } else if (connectedDydxAddress && isConnectedGraz) {
        try {
          const dydxOfflineSigner = await getCosmosOfflineSigner(selectedDydxChainId);
          if (dydxOfflineSigner) {
            setLocalDydxWallet(await LocalWallet.fromOfflineSigner(dydxOfflineSigner));
            dispatch(setOnboardingState(OnboardingState.AccountConnected));
          }
        } catch (error) {
          log('useAccounts/setLocalDydxWallet', error);
        }
      } else if (evmAddress) {
        if (!localDydxWallet) {
          dispatch(setOnboardingState(OnboardingState.WalletConnected));

          const evmDerivedAccount = evmDerivedAddresses[evmAddress];

          if (connectedWallet?.connectorType === ConnectorType.Privy && authenticated && ready) {
            try {
              // Give Privy a second to finish the auth flow before getting the signature
              await sleep();
              const signature = await signMessageAsync();

              await setWalletFromSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              forgetEvmSignature();
            }
          } else if (evmDerivedAccount?.encryptedSignature) {
            try {
              const signature = decryptSignature(evmDerivedAccount.encryptedSignature);

              await setWalletFromSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              forgetEvmSignature();
            }
          }
        } else {
          dispatch(setOnboardingState(OnboardingState.AccountConnected));
        }
      } else if (solAddress) {
        if (!localDydxWallet) {
          dispatch(setOnboardingState(OnboardingState.WalletConnected));

          const solDerivedAccount = solDerivedAddresses[solAddress];
          if (solDerivedAccount?.encryptedSignature) {
            try {
              const signature = decryptSignature(solDerivedAccount.encryptedSignature);
              await setWalletFromSignature(signature);
              dispatch(setOnboardingState(OnboardingState.AccountConnected));
            } catch (error) {
              log('useAccounts/decryptSignature', error);
              forgetSolSignature();
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
  }, [
    evmAddress,
    evmDerivedAddresses,
    signerWagmi,
    solAddress,
    solDerivedAddresses,
    connectedDydxAddress,
    isConnectedGraz,
  ]);

  // abacus
  useEffect(() => {
    if (dydxAddress) abacusStateManager.setAccount(localDydxWallet, hdKey, connectedWallet);
    else abacusStateManager.attemptDisconnectAccount();
  }, [localDydxWallet, hdKey, dydxAddress, connectedWallet]);

  useEffect(() => {
    const setNobleWallet = async () => {
      let nobleWallet: LocalWallet | undefined;
      if (hdKey?.mnemonic) {
        nobleWallet = await LocalWallet.fromMnemonic(hdKey.mnemonic, NOBLE_BECH32_PREFIX);
      }

      const nobleOfflineSigner = await getCosmosOfflineSigner(nobleChainId);
      if (nobleOfflineSigner !== undefined) {
        nobleWallet = await LocalWallet.fromOfflineSigner(nobleOfflineSigner);
      }

      if (nobleWallet !== undefined) {
        abacusStateManager.setNobleWallet(nobleWallet);
        setLocalNobleWallet(nobleWallet);
      }
    };
    setNobleWallet();
  }, [hdKey?.mnemonic, getCosmosOfflineSigner, nobleChainId]);

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
    selectWallet(undefined);
  };

  return {
    // Wallet connection
    connectedWallet,

    // Wallet selection
    selectWallet,
    selectedWallet,
    selectedWalletError,

    // Wallet connection (EVM)
    evmAddress,
    signerWagmi,
    publicClientWagmi,

    // Wallet connection (sol)
    solAddress,

    setWalletFromSignature,

    // EVM → dYdX account derivation
    saveEvmSignature,
    forgetEvmSignature,

    // SOL → dYdX account derivation
    saveSolSignature,
    forgetSolSignature,

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

    // cosmos account
    dydxAccountGraz,
  };
};
