import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import {
  IndexerFundingPaymentResponse,
  IndexerFundingPaymentResponseObject,
} from '@/types/indexer/indexerApiGen';

import { getSubaccountId, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { Loadable } from '../lib/loadable';
import { wrapAndLogBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { useIndexerClient } from './lib/useIndexer';

export const useFundingPayments = (): Loadable<IndexerFundingPaymentResponseObject[]> => {
  const { indexerClient, key: indexerKey } = useIndexerClient();
  const address = useAppSelector(getUserWalletAddress);
  const subaccountNumber = useAppSelector(getSubaccountId);

  const fundingPaymentsQuery = useQuery({
    enabled: Boolean(indexerClient) && Boolean(address) && subaccountNumber != null,
    queryKey: ['fundingPayments', address, subaccountNumber, indexerKey],
    queryFn: wrapAndLogBonsaiError(async () => {
      if (!indexerClient) {
        throw new Error('Indexer client not found');
      } else if (!address) {
        throw new Error('Address not found');
      } else if (subaccountNumber == null) {
        throw new Error('Subaccount number not found');
      }

      const result: IndexerFundingPaymentResponse =
        await indexerClient.account.getParentSubaccountNumberFundingPayments(
          address,
          subaccountNumber
        );

      return result.fundingPayments.reverse();
    }, 'fundingPayments'),
    refetchInterval: 10 * timeUnits.minute,
    staleTime: timeUnits.hour,
  });

  return queryResultToLoadable(fundingPaymentsQuery);
};
