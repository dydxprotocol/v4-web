import { selectIndexerReady, selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useQuery } from '@tanstack/react-query';

import { AddressFormat } from '@/types/turnkey';

import { useAppSelector } from '@/state/appTypes';
import { getTurnkeyPrimaryWallet, selectIsTurnkeyConnected } from '@/state/walletSelectors';

import { useAccounts } from './useAccounts';

export const useDepositAddress = () => {
  const { dydxAddress } = useAccounts();
  const indexerUrl = useAppSelector(selectIndexerUrl);
  const indexerReady = useAppSelector(selectIndexerReady);
  const isTurnkeyConnected = useAppSelector(selectIsTurnkeyConnected);
  const primaryTurnkeyWallet = useAppSelector(getTurnkeyPrimaryWallet);

  const turnkeyEvmAddress = primaryTurnkeyWallet?.accounts.find(
    (account) => account.addressFormat === AddressFormat.Ethereum
  )?.address;

  const canQueryForDepositAddresses =
    dydxAddress != null && indexerReady && isTurnkeyConnected && turnkeyEvmAddress != null;

  const {
    data: depositAddresses,
    isLoading: isLoadingDepositAddresses,
    isError: failedToFetchDepositAddresses,
    error: fetchDepositAddressesError,
  } = useQuery({
    enabled: canQueryForDepositAddresses,
    queryKey: ['turnkeyWallets', dydxAddress, turnkeyEvmAddress],
    queryFn: async (): Promise<{
      avalancheAddress: string;
      evmAddress: string;
      svmAddress: string;
    }> => {
      const response = await fetch(`${indexerUrl}/v4/bridging/getDepositAddress/${dydxAddress}`, {
        method: 'GET',
      }).then((res) => res.json());

      if (
        typeof response?.evmAddress !== 'string' ||
        response.evmAddress.toLowerCase() !== turnkeyEvmAddress?.toLowerCase()
      ) {
        throw new Error('Deposit addresses do not match the connected Turnkey wallet');
      }

      return response;
    },
  });

  return {
    depositAddresses,
    isLoadingDepositAddresses,
    failedToFetchDepositAddresses,
    fetchDepositAddressesError,
  };
};
