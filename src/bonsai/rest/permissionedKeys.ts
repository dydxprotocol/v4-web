import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { AccountAuthenticator } from '@/constants/validators';

import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isPresent } from '@/lib/typeUtils';

import { getLazyTradingKeyUtils } from '../lib/lazyDynamicLibs';
import { useCompositeClient } from './lib/useIndexer';

export function useAuthorizedAccounts() {
  const address = useAppSelector(getUserWalletAddress);
  const client = useCompositeClient();

  return useQuery({
    queryKey: ['validator', 'permissionedKeys', 'authorizedAccounts', address, client.key],
    enabled: isPresent(address) && isPresent(client),
    queryFn: async (): Promise<AccountAuthenticator[]> => {
      if (!address || !client.compositeClient) {
        throw new Error('Invalid authorized accounts query state');
      }

      const response = await client.compositeClient.getAuthenticators(address);
      const parsedResponse = (await getLazyTradingKeyUtils()).getAuthorizedTradingKeysMetadata(
        response.accountAuthenticators
      );
      return parsedResponse;
    },
    staleTime: timeUnits.hour,
    refetchInterval: timeUnits.hour,
  });
}
