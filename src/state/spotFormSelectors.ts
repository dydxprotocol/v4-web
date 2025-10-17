import { BonsaiCore, BonsaiForms } from '@/bonsai/ontology';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';

export const getSpotFormRawState = (state: RootState) => state.spotForm;

export const getSpotFormInputData = createAppSelector(
  [BonsaiCore.spot.solPrice.data],
  (solPriceUsd) => {
    return {
      tokenSymbol: 'FARTCOIN',
      tokenPriceUsd: 0.5,
      solPriceUsd,
      userSolBalance: 100,
      userTokenBalance: 5000,
    };
  }
);

export const getSpotFormSummary = createAppSelector(
  [getSpotFormRawState, getSpotFormInputData],
  (formState, inputData) => {
    const summary = BonsaiForms.SpotFormFns.calculateSummary(formState, inputData);
    const errors = BonsaiForms.SpotFormFns.getErrors(formState, inputData, summary);

    return {
      inputData,
      summary,
      errors,
      state: formState,
    };
  }
);
