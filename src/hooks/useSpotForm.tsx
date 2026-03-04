import { useCallback, useMemo } from 'react';

import { SpotBuyInputType, SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';
import { ErrorType, getHighestPriorityAlert } from '@/bonsai/lib/validationErrors';
import { BonsaiCore } from '@/bonsai/ontology';

import { ComplianceStates } from '@/constants/compliance';

import { useAccounts } from '@/hooks/useAccounts';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useSpotTransactionSubmit } from '@/hooks/useSpotTransactionSubmit';

import { formatNumberOutput, OutputType } from '@/components/Output';

import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { spotFormActions } from '@/state/spotForm';
import { getSpotFormSummary } from '@/state/spotFormSelectors';
import { addSpotTrade, updateSpotTrade } from '@/state/spotTrades';

import { SpotApiSide } from '@/clients/spotApi';

import { useComplianceState } from './useComplianceState';

// TODO: spot localization

export function useSpotForm() {
  const dispatch = useAppDispatch();
  const formSummary = useAppSelector(getSpotFormSummary);
  const { canDeriveSolanaWallet } = useAccounts();
  const { mutateAsync: submitTransactionMutation } = useSpotTransactionSubmit();
  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { complianceState } = useComplianceState();

  const hasErrors = useMemo(
    () => formSummary.errors.some((error) => error.type === ErrorType.error),
    [formSummary.errors]
  );

  const primaryAlert = useMemo(
    () => getHighestPriorityAlert(formSummary.errors),
    [formSummary.errors]
  );

  const canSubmit = useMemo(
    () =>
      canDeriveSolanaWallet &&
      !hasErrors &&
      formSummary.summary.payload != null &&
      complianceState !== ComplianceStates.READ_ONLY,
    [canDeriveSolanaWallet, complianceState, formSummary.summary.payload, hasErrors]
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

  const submitTransaction = useCallback(() => {
    const tradeId = `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const side = formSummary.state.side === SpotSide.BUY ? SpotApiSide.BUY : SpotApiSide.SELL;
    const tokenSymbol = tokenMetadata?.symbol ?? '';

    dispatch(
      addSpotTrade({
        trade: {
          id: tradeId,
          side,
          tokenSymbol,
          tokenAmount: '',
          solAmount: '',
          txHash: '',
          status: 'pending',
          createdAt: Date.now(),
        },
      })
    );

    // Pass payload as a mutation variable so it's captured at invocation time.
    // React-Query v5's MutationObserver.setOptions() overwrites an in-flight
    // mutation's mutationFn when pending, so closure-captured values are unsafe.
    const mutationPromise = submitTransactionMutation({
      payload: formSummary.summary.payload!,
    });

    // Reset form — mutation has the payload as a variable, immune to re-render
    dispatch(spotFormActions.reset());

    appQueryClient.invalidateQueries({
      queryKey: ['spot', 'portfolioTrades'],
      exact: false,
    });

    mutationPromise
      .then((result) => {
        const { landResponse } = result;

        const formattedTokenAmount = formatNumberOutput(
          landResponse.tokenChange,
          OutputType.Asset,
          { decimalSeparator, groupSeparator, selectedLocale }
        );
        const formattedSolAmount = formatNumberOutput(landResponse.solChange, OutputType.Asset, {
          decimalSeparator,
          groupSeparator,
          selectedLocale,
        });

        dispatch(
          updateSpotTrade({
            trade: {
              id: tradeId,
              tokenAmount: formattedTokenAmount,
              solAmount: formattedSolAmount,
              txHash: landResponse.txHash,
              status: 'success',
            },
          })
        );
      })
      .catch(() => {
        dispatch(
          updateSpotTrade({
            trade: {
              id: tradeId,
              status: 'error',
            },
          })
        );
      });
  }, [
    formSummary.state.side,
    formSummary.summary.payload,
    tokenMetadata?.symbol,
    dispatch,
    submitTransactionMutation,
    decimalSeparator,
    groupSeparator,
    selectedLocale,
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
    handleInputTypeChange,
    submitTransaction,
  };
}
