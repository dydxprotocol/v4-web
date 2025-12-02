import { SpotFormInputData } from '@/bonsai/forms/spot';
import { BonsaiCore, BonsaiForms } from '@/bonsai/ontology';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { SpotApiTradeRoute } from '@/clients/spotApi';

import { type RootState } from './_store';
import { getUserSolanaWalletAddress } from './accountInfoSelectors';
import { createAppSelector } from './appTypes';
import { getCurrentSpotToken } from './spot';

export const getSpotFormRawState = (state: RootState) => state.spotForm;

export const getSpotFormInputData = createAppSelector(
  [
    BonsaiCore.spot.solPrice.data,
    BonsaiCore.spot.tokenMetadata.data,
    BonsaiCore.spot.tokenPrice.data,
    BonsaiCore.spot.walletPositions.data,
    getCurrentSpotToken,
    getUserSolanaWalletAddress,
  ],
  (
    solPriceUsd,
    tokenMetadata,
    tokenPriceUsd,
    walletPositions,
    tokenMint,
    solanaAddress
  ): SpotFormInputData => ({
    tokenPriceUsd,
    solPriceUsd,
    userSolBalance: walletPositions?.solBalance
      ? walletPositions.solBalance / LAMPORTS_PER_SOL
      : undefined,
    userTokenBalance: walletPositions?.tokenBalances.find((position) => position.mint === tokenMint)
      ?.amount,
    tokenMint: tokenMetadata?.tokenMint,
    decimals: tokenMetadata?.decimals,
    pairAddress: tokenMetadata?.pairAddress,
    tradeRoute: tokenMetadata?.tradeRoute as SpotApiTradeRoute | undefined,
    solanaAddress,
  })
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
