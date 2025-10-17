import { useMemo } from 'react';

import { SpotSide } from '@/bonsai/forms/spot';
import { ErrorType } from '@/bonsai/lib/validationErrors';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { spotFormActions } from '@/state/spotForm';
import { getSpotFormSummary } from '@/state/spotFormSelectors';

// Hook to use spot form with Redux
export function useSpotForm() {
  const dispatch = useAppDispatch();
  const formSummary = useAppSelector(getSpotFormSummary);

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

  // Check if there are any error-level errors
  const hasErrors = useMemo(
    () => formSummary.errors.some((error) => error.type === ErrorType.error),
    [formSummary.errors]
  );

  return {
    state: formSummary.state,
    actions,
    summary: formSummary.summary,
    errors: formSummary.errors,
    inputData: formSummary.inputData,
    hasErrors,
  };
}
