import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { usePrivy } from '@privy-io/react-auth';
import { type Subaccount } from 'starboard-client-js';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import { DydxAddress, PrivateInformation } from '@/constants/wallets';

import { setOnboardingGuard, setOnboardingState } from '@/state/account';
import { getGeo } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSourceAccount } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';

import { useDydxClient } from './useDydxClient';
import { useEnvFeatures } from './useEnvFeatures';
import { useFuelWallet } from './useFuelWallet';
import { useLocalStorage } from './useLocalStorage';

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
      if (
        onboardingState === OnboardingState.WalletConnected ||
        onboardingState === OnboardingState.Disconnected
      ) {
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

    setPreviousAddress(address);
    // We only want to set the source wallet address if the address changes
    // OR when our connection state changes.
    // The address can be cached via local storage, so it won't change when we reconnect
    // But the hasSubAccount value will become true once you reconnect
    // This allows us to trigger a state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceAccount.address, sourceAccount.chain, hasSubAccount]);

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

  const [hdKey, setHdKey] = useState<PrivateInformation>();

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
    disconnectFuel();
  };

  return {
    // Wallet connection
    sourceAccount,

    // Wallet selection
    selectWallet,
    selectedWalletError,

    // Wallet connection (Fuel)
    fuel,
    isConnected: isConnectedFuel,
    address: fuelAddress,

    // dYdX accounts
    hdKey,

    // TODO: We'll replace with Connected Fuel Wallet
    dydxAddress: undefined as any as DydxAddress,

    // Onboarding state
    saveHasAcknowledgedTerms,

    // Disconnect wallet / accounts
    disconnect,

    // dydxClient Account methods
    getSubaccounts,
  };
};
