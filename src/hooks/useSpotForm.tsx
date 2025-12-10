import { useCallback, useMemo } from 'react';

import { SpotBuyInputType, SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';
import { ErrorType, getHighestPriorityAlert } from '@/bonsai/lib/validationErrors';
import { BonsaiCore } from '@/bonsai/ontology';

import { useAccounts } from '@/hooks/useAccounts';
import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useSpotTransactionSubmit } from '@/hooks/useSpotTransactionSubmit';

import { Icon, IconName } from '@/components/Icon';
import { formatNumberOutput, OutputType } from '@/components/Output';

import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { spotFormActions } from '@/state/spotForm';
import { getSpotFormSummary } from '@/state/spotFormSelectors';

import { SpotApiSide } from '@/clients/spotApi';

// TODO: spot localization

export function useSpotForm() {
  const dispatch = useAppDispatch();
  const formSummary = useAppSelector(getSpotFormSummary);
  const { canDeriveSolanaWallet } = useAccounts();
  const { mutateAsync: submitTransactionMutation, isPending } = useSpotTransactionSubmit();
  const notify = useCustomNotification();
  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const hasErrors = useMemo(
    () => formSummary.errors.some((error) => error.type === ErrorType.error),
    [formSummary.errors]
  );

  const primaryAlert = useMemo(
    () => getHighestPriorityAlert(formSummary.errors),
    [formSummary.errors]
  );

  const canSubmit = useMemo(
    () => canDeriveSolanaWallet && !hasErrors && formSummary.summary.payload != null && !isPending,
    [canDeriveSolanaWallet, formSummary.summary.payload, hasErrors, isPending]
  );

  const actions = useMemo(
    () => ({
      setSide: (side: SpotSide) => dispatch(spotFormActions.setSide(side)),
      setBuyInputType: (type: Parameters<typeof spotFormActions.setBuyInputType>[0]) =>
        dispatch(spotFormActions.setBuyInputType(type)),
      setSellInputType: (type: Parameters<typeof spotFormActions.setSellInputType>[0]) =>
        dispatch(spotFormActions.setSellInputType(type)),
      setSize: (size: string) => dispatch(spotFormActions.setSize(size)),
      reset: () => dispatch(spotFormActions.reset()),
    }),
    [dispatch]
  );

  const handleInputTypeChange = useCallback(
    (side: SpotSide, type: SpotBuyInputType | SpotSellInputType) => {
      const amounts = formSummary.summary.amounts;

      if (side === SpotSide.BUY) {
        const nextType = type as SpotBuyInputType;
        const nextSizeNum = nextType === SpotBuyInputType.USD ? amounts?.usd : amounts?.sol;

        dispatch(spotFormActions.setBuyInputType(nextType));
        dispatch(spotFormActions.setSize(nextSizeNum?.toString() ?? ''));
        return;
      }

      const nextType = type as SpotSellInputType;
      const nextSizeNum = nextType === SpotSellInputType.USD ? amounts?.usd : amounts?.percent;

      dispatch(spotFormActions.setSellInputType(nextType));
      dispatch(spotFormActions.setSize(nextSizeNum?.toString() ?? ''));
    },
    [dispatch, formSummary.summary.amounts]
  );

  const submitTransaction = useCallback(async () => {
    const payload = formSummary.summary.payload;
    if (!payload) {
      throw new Error('No payload available');
    }

    try {
      const result = await submitTransactionMutation(payload);
      dispatch(spotFormActions.reset());

      appQueryClient.invalidateQueries({
        queryKey: ['spot', 'portfolioTrades'],
        exact: false,
      });

      const { landResponse } = result;
      const isBuy = landResponse.side === SpotApiSide.BUY;
      const tokenSymbol = tokenMetadata?.symbol ?? '';

      const formattedTokenAmount = formatNumberOutput(landResponse.tokenChange, OutputType.Asset, {
        decimalSeparator,
        groupSeparator,
        selectedLocale,
      });

      const formattedSolAmount = formatNumberOutput(landResponse.solChange, OutputType.Asset, {
        decimalSeparator,
        groupSeparator,
        selectedLocale,
      });

      notify(
        {
          title: 'Trade Successful',
          slotTitleLeft: <Icon iconName={IconName.CheckCircle} tw="text-color-success" />,
          body: `${isBuy ? 'Purchased' : 'Sold'} ${formattedTokenAmount} ${tokenSymbol} for ${formattedSolAmount} SOL`,
        },
        {
          toastDuration: 5000,
        }
      );

      return result;
    } catch (error) {
      notify(
        {
          title: 'Transaction Failed',
          slotTitleLeft: <Icon iconName={IconName.Warning} tw="text-color-error" />,
          body: 'Transaction failed. Please try again.',
        },
        {
          toastDuration: 5000,
        }
      );
      throw error;
    }
  }, [
    dispatch,
    formSummary.summary.payload,
    submitTransactionMutation,
    tokenMetadata?.symbol,
    decimalSeparator,
    groupSeparator,
    selectedLocale,
    notify,
  ]);

  return {
    state: formSummary.state,
    actions,
    summary: formSummary.summary,
    errors: formSummary.errors,
    inputData: formSummary.inputData,
    hasErrors,
    primaryAlert,
    canSubmit,
    isPending,
    handleInputTypeChange,
    submitTransaction,
  };
}
