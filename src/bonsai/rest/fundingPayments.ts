import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { IndexerFundingPaymentResponse } from '@/types/indexer/indexerApiGen';

import { getSubaccountId, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { Loadable } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { wrapAndLogBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { useIndexerClient } from './lib/useIndexer';

export type FundingPayment = {
  createdAt: string;
  createdAtHeight: string;
  perpetualId: string;
  ticker: string;
  oraclePrice: string;
  size: string;
  side: string;
  rate: string;
  payment: string;
  subaccountNumber: string;
};

export const useFundingPaymentsData = () => {
  const payments = useFundingPayments();
  return useMemo(() => {
    return payments.data;
  }, [payments.data]);
};

export const useFundingPayments = (): Loadable<FundingPayment[]> => {
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

      return result.fundingPayments.reverse().map((funding) => ({
        createdAt: funding.createdAt,
        createdAtHeight: funding.createdAtHeight,
        perpetualId: funding.perpetualId,
        ticker: funding.ticker,
        oraclePrice: funding.oraclePrice,
        size: funding.size,
        side: funding.side,
        rate: funding.rate,
        payment: funding.payment,
        subaccountNumber: funding.subaccountNumber,
      }));
    }, 'fundingPayments'),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });

  const data = useMemo(() => fundingPaymentsQuery.data ?? [], [fundingPaymentsQuery.data]);

  return mapLoadableData(queryResultToLoadable(fundingPaymentsQuery), () => data);
};
