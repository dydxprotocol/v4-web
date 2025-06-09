import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getLazyLocalWallet } from '@/bonsai/lib/lazyDynamicLibs';
import { BonsaiCore } from '@/bonsai/ontology';
import { type LocalWallet, NOBLE_BECH32_PREFIX, type Subaccount } from '@dydxprotocol/v4-client-js';
import { usePrivy } from '@privy-io/react-auth';
import { AES, enc } from 'crypto-js';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  NEUTRON_BECH32_PREFIX,
  OSMO_BECH32_PREFIX,
} from '@/constants/graz';
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
    selectWallet,
    selectedWallet,
    selectedWalletError,
    signerWagmi,
    publicClientWagmi,
    getCosmosOfflineSigner,
    isConnectedGraz,
    dydxAccountGraz,
  } = useWalletConnection();

  const hasSubAccount = useAppSelector(BonsaiCore.account.parentSubaccountSummary.data) != null;
  const sourceAccount = useAppSelector(getSourceAccount);

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
      if (error.status === 404 || error.status === 403) {
        return [];
      }
      throw error;
    }
  };

  // dYdX wallet / onboarding state
  const [localDydxWallet, setLocalDydxWallet] = useState<LocalWallet>();
  const [localNobleWallet, setLocalNobleWallet] = useState<LocalWallet>();
  const [localOsmosisWallet, setLocalOsmosisWallet] = useState<LocalWallet>();
  const [localNeutronWallet, setLocalNeutronWallet] = useState<LocalWallet>();

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
      } else if (sourceAccount.chain === WalletNetworkType.Cosmos && isConnectedGraz) {
        try {
          const dydxOfflineSigner = await getCosmosOfflineSigner(selectedDydxChainId);
          if (dydxOfflineSigner) {
            setLocalDydxWallet(
              await (await getLazyLocalWallet()).fromOfflineSigner(dydxOfflineSigner)
            );
            dispatch(setOnboardingState(OnboardingState.AccountConnected));
          }
        } catch (error) {
          log('useAccounts/setLocalDydxWallet', error);
        }
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
  }, [signerWagmi, isConnectedGraz, sourceAccount, hasLocalDydxWallet, blockedGeo]);

  useEffect(() => {
    const setCosmosWallets = async () => {
      let nobleWallet: LocalWallet | undefined;
      let osmosisWallet: LocalWallet | undefined;
      let neutronWallet: LocalWallet | undefined;
      if (hdKey?.mnemonic) {
        nobleWallet = await (
          await getLazyLocalWallet()
        ).fromMnemonic(hdKey.mnemonic, NOBLE_BECH32_PREFIX);
        osmosisWallet = await (
          await getLazyLocalWallet()
        ).fromMnemonic(hdKey.mnemonic, OSMO_BECH32_PREFIX);
        neutronWallet = await (
          await getLazyLocalWallet()
        ).fromMnemonic(hdKey.mnemonic, NEUTRON_BECH32_PREFIX);
      }

      try {
        const nobleOfflineSigner = await getCosmosOfflineSigner(getNobleChainId());
        if (nobleOfflineSigner !== undefined) {
          nobleWallet = await (await getLazyLocalWallet()).fromOfflineSigner(nobleOfflineSigner);
        }
        const osmosisOfflineSigner = await getCosmosOfflineSigner(getOsmosisChainId());
        if (osmosisOfflineSigner !== undefined) {
          osmosisWallet = await (
            await getLazyLocalWallet()
          ).fromOfflineSigner(osmosisOfflineSigner);
        }
        const neutronOfflineSigner = await getCosmosOfflineSigner(getNeutronChainId());
        if (neutronOfflineSigner !== undefined) {
          neutronWallet = await (
            await getLazyLocalWallet()
          ).fromOfflineSigner(neutronOfflineSigner);
        }

        if (nobleWallet !== undefined) {
          setLocalNobleWallet(nobleWallet);
        }
        if (osmosisWallet !== undefined) {
          setLocalOsmosisWallet(osmosisWallet);
        }
        if (neutronWallet !== undefined) {
          setLocalNeutronWallet(neutronWallet);
        }
      } catch (error) {
        log('useAccounts/setCosmosWallets', error);
      }
    };
    setCosmosWallets();
  }, [hdKey?.mnemonic, getCosmosOfflineSigner]);

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
    setLocalDydxWallet(undefined);
    setHdKey(undefined);
    hdKeyManager.clearHdkey();
  };

  const disconnect = async () => {
    // Disconnect local wallet
    disconnectLocalDydxWallet();
    selectWallet(undefined);
  };

  return {
    // Wallet connection
    sourceAccount,
    localNobleWallet,

    // Wallet selection
    selectWallet,
    selectedWallet,
    selectedWalletError,

    // Wallet connection (EVM)
    signerWagmi,
    publicClientWagmi,

    setWalletFromSignature,

    // dYdX accounts
    hdKey,
    localDydxWallet,
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

    // cosmos account
    dydxAccountGraz,
  };
};
