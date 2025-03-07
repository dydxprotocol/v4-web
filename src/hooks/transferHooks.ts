import { useEffect, useMemo, useState } from 'react';

import { TransferFeeData, TransferFormFns, TransferFormInputData } from '@/bonsai/forms/transfers';
import { useFormValues } from '@/bonsai/lib/forms';
import { BonsaiCore, BonsaiRaw } from '@/bonsai/ontology';
import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { wrapAndLogError } from '@/lib/asyncUtils';

import { useDebounce } from './useDebounce';
import { useSubaccount } from './useSubaccount';
import { useTokenConfigs } from './useTokenConfigs';

export function useTransferForm(initialToUsdc: boolean) {
  const rawParentSubaccountData = useAppSelector(BonsaiRaw.parentSubaccountBase);
  const rawRelevantMarkets = useAppSelector(BonsaiRaw.parentSubaccountRelevantMarkets);
  const walletBalances = useAppSelector(BonsaiCore.account.balances.data);
  const canViewAccount = useAppSelector(calculateCanViewAccount);
  const {
    usdcLabel,
    chainTokenLabel,
    chainTokenDecimals,
    usdcDecimals,
    usdcDenom,
    chainTokenDenom,
  } = useTokenConfigs();

  const [feeResult, setFeeResult] = useState<TransferFeeData | undefined>(undefined);

  const inputs = useMemo(
    (): TransferFormInputData => ({
      rawParentSubaccountData,
      rawRelevantMarkets,
      canViewAccount,
      walletBalances,
      display: {
        usdcName: usdcLabel,
        usdcDecimals,
        usdcDenom,
        nativeName: chainTokenLabel,
        nativeDecimals: chainTokenDecimals,
        nativeDenom: chainTokenDenom,
      },

      feeResult,
    }),
    [
      canViewAccount,
      chainTokenDecimals,
      chainTokenDenom,
      chainTokenLabel,
      feeResult,
      rawParentSubaccountData,
      rawRelevantMarkets,
      usdcDecimals,
      usdcDenom,
      usdcLabel,
      walletBalances,
    ]
  );

  const formValues = useFormValues(TransferFormFns, inputs);

  useEffect(() => {
    if (initialToUsdc) {
      formValues.actions.setUsdcAmount('');
    } else {
      formValues.actions.setNativeAmount('');
    }
  }, [formValues.actions, initialToUsdc]);

  const payload = formValues.summary.payload;
  const amountDebounced = useDebounce(payload?.amount, 500);
  const recipientDebounced = useDebounce(payload?.recipient, 500);
  const { simulateTransfer } = useSubaccount();
  const { data: feeQueryResult } = useQuery({
    enabled: payload != null && amountDebounced != null && recipientDebounced != null,
    queryKey: ['simulateTransfer', amountDebounced, recipientDebounced, payload?.type],
    queryFn: wrapAndLogError(
      async (): Promise<TransferFeeData> => {
        const result = await simulateTransfer({
          amount: amountDebounced!,
          recipient: recipientDebounced!,
          type: payload!.type,
        });
        if (result.type === 'success') {
          return {
            amount: result.payload.amount[0]?.amount,
            denom: result.payload.amount[0]?.denom,
            requestedFor: {
              amount: amountDebounced!.toString(),
              type: payload!.type,
            },
          };
        }
        return {
          amount: undefined,
          denom: undefined,
          requestedFor: {
            amount: amountDebounced!.toString(),
            type: payload!.type,
          },
        };
      },
      'transferForm/simulateTransfer',
      true
    ),
    refetchInterval: timeUnits.second * 30,
    staleTime: timeUnits.second * 30,
  });

  useEffect(() => setFeeResult(feeQueryResult), [feeQueryResult]);

  return formValues;
}
