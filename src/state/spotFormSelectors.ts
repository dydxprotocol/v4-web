import { SpotFormInputData } from '@/bonsai/forms/spot';
import { BonsaiCore, BonsaiForms } from '@/bonsai/ontology';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { SpotWalletStatus } from '@/constants/account';

import { SpotApiTradeRoute } from '@/clients/spotApi';
import { isPresent } from '@/lib/typeUtils';

import { type RootState } from './_store';
import { calculateSpotWalletStatus } from './accountCalculators';
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
    BonsaiCore.spot.solPrice.loading,
    BonsaiCore.spot.tokenMetadata.loading,
    BonsaiCore.spot.tokenPrice.loading,
    BonsaiCore.spot.walletPositions.loading,
    getCurrentSpotToken,
    getUserSolanaWalletAddress,
    calculateSpotWalletStatus,
  ],
  (
    solPriceUsd,
    tokenMetadata,
    tokenPriceUsd,
    walletPositions,
    solPriceStatus,
    tokenMetadataStatus,
    tokenPriceStatus,
    walletPositionsStatus,
    tokenMint,
    solanaAddress,
    walletStatus
  ): SpotFormInputData => {
    const userSolBalance = isPresent(walletPositions?.solBalance)
      ? walletPositions.solBalance / LAMPORTS_PER_SOL
      : undefined;

    const userTokenBalance = walletPositions?.tokenBalances.find(
      (position) => position.mint === tokenMint
    )?.amount;

    const isMarketDataReady = [solPriceStatus, tokenMetadataStatus, tokenPriceStatus].every(
      (status) => status === 'success'
    );

    // For connected users, also wait for wallet positions (for balances)
    const isAsyncDataReady =
      walletStatus === SpotWalletStatus.Connected
        ? isMarketDataReady && walletPositionsStatus === 'success'
        : isMarketDataReady;

    const isRestReady = isPresent(tokenMint) && isPresent(solanaAddress);

    return {
      tokenPriceUsd,
      solPriceUsd,
      userSolBalance,
      userTokenBalance,
      tokenMint: tokenMetadata?.tokenMint,
      decimals: tokenMetadata?.decimals,
      pairAddress: tokenMetadata?.pairAddress,
      tradeRoute: tokenMetadata?.tradeRoute as SpotApiTradeRoute | undefined,
      solanaAddress,
      isReady: isRestReady && isAsyncDataReady,
      isAsyncDataReady,
      isRestReady,
      walletStatus,
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
