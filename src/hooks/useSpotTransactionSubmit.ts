import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import { VersionedTransaction } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import bs58 from 'bs58';

import { AnalyticsEvents } from '@/constants/analytics';

import { useAppSelector } from '@/state/appTypes';
import { getSpotFormSummary } from '@/state/spotFormSelectors';

import {
  SpotApiCreateTransactionRequest,
  SpotApiLandingMethod,
  SpotApiSide,
  createSpotTransaction,
  landSpotTransaction,
} from '@/clients/spotApi';
import { track } from '@/lib/analytics/analytics';
import { isSimpleFetchError } from '@/lib/simpleFetch';
import { startTimer } from '@/lib/simpleTimer';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';

export const useSpotTransactionSubmit = () => {
  const {
    inputData: formInputData,
    state: formState,
    summary: formSummary,
  } = useAppSelector(getSpotFormSummary);
  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);
  const { localSolanaKeypair, solanaAddress } = useAccounts();
  const spotApiEndpoint = useEndpointsConfig().spotApi;

  const makeTransaction = async () => {
    const createPayload = formSummary.payload;
    // Should never happen - submit button should always be disabled when payload is not truthy
    if (!createPayload) {
      logBonsaiError('spot/useSpotTransactionSubmit', 'No payload available', {
        formInputData,
        formState,
      });
      throw new Error('No payload available');
    }

    const totalTimer = startTimer();
    const timingMs: Record<string, number> = {};

    let step: 'validateWallet' | 'createTransaction' | 'signTransaction' | 'landTransaction' =
      'validateWallet';

    logBonsaiInfo('spot/useSpotTransactionSubmit', 'Crafting a transaction', {
      createPayload,
      formInputData,
      formState,
    });
    track(
      AnalyticsEvents.SpotTransactionSubmitStarted({
        side: createPayload.side,
        tokenMint: createPayload.tokenMint,
        tokenSymbol: tokenMetadata?.symbol,
        tradeRoute: createPayload.tradeRoute,
        estimatedUsdAmount: formSummary.amounts?.usd,
        inputType:
          createPayload.side === SpotApiSide.BUY ? formState.buyInputType : formState.sellInputType,
      })
    );

    try {
      if (!localSolanaKeypair || !solanaAddress) {
        throw new Error('Solana wallet not derived. Please reconnect your wallet.');
      }

      const requestWithAccount: SpotApiCreateTransactionRequest = {
        ...createPayload,
        account: solanaAddress,
      };

      // Create (unsigned) transaction from backend
      step = 'createTransaction';
      const createTransactionTimer = startTimer();
      const createResponse = await createSpotTransaction(spotApiEndpoint, requestWithAccount);
      timingMs.createTransactionMs = createTransactionTimer.elapsed();

      // Sign, serialize, and encode
      step = 'signTransaction';
      const signTimer = startTimer();
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(createResponse.transaction, 'base64')
      );
      transaction.sign([localSolanaKeypair]);
      const signedTransactionBase58 = bs58.encode(transaction.serialize());
      timingMs.signTransactionMs = signTimer.elapsed();

      // Land signed transaction
      step = 'landTransaction';
      const landTransactionTimer = startTimer();
      const landResponse = await landSpotTransaction(spotApiEndpoint, {
        signedTransaction: signedTransactionBase58,
        expectedTokenMint: createPayload.tokenMint,
        landingMethod: createResponse.metadata.jupiterRequestId
          ? SpotApiLandingMethod.JUPITER
          : undefined,
        jupiterRequestId: createResponse.metadata.jupiterRequestId,
        walletAddress: solanaAddress,
      });
      timingMs.landTransactionMs = landTransactionTimer.elapsed();

      timingMs.totalMs = totalTimer.elapsed();
      logBonsaiInfo('spot/useSpotTransactionSubmit', 'Successfuly landed a transaction', {
        createPayload,
        formInputData,
        formState,
        createMetadata: createResponse.metadata,
        landResponse,
        timingMs,
      });
      track(
        AnalyticsEvents.SpotTransactionSubmitSuccess({
          side: createPayload.side,
          tokenMint: createPayload.tokenMint,
          tokenSymbol: tokenMetadata?.symbol,
          tradeRoute: createPayload.tradeRoute,
          usdAmount: landResponse.metrics.boughtUsd + landResponse.metrics.soldUsd,
          solAmount: landResponse.solChange,
          timingMs,
        })
      );

      return {
        createResponse,
        landResponse,
      };
    } catch (error) {
      timingMs.totalMs = totalTimer.elapsed();

      const errorName = error instanceof Error ? error.name : 'UnknownError';
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse = isSimpleFetchError(error)
        ? await error.response.text().catch(() => undefined)
        : undefined;

      logBonsaiError('spot/useSpotTransactionSubmit', 'Transaction failure', {
        error,
        createPayload,
        formInputData,
        formState,
        step,
        timingMs,
        errorName,
        errorMessage,
        errorResponse,
      });
      track(
        AnalyticsEvents.SpotTransactionSubmitError({
          side: createPayload.side,
          tokenMint: createPayload.tokenMint,
          tokenSymbol: tokenMetadata?.symbol,
          tradeRoute: createPayload.tradeRoute,
          estimatedUsdAmount: formSummary.amounts?.usd,
          step,
          errorName,
          errorMessage,
        })
      );

      throw error;
    }
  };

  return useMutation({
    mutationFn: makeTransaction,
  });
};
