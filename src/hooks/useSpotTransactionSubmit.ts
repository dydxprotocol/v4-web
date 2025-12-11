import { wrapAndLogBonsaiError } from '@/bonsai/logs';
import { VersionedTransaction } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import bs58 from 'bs58';

import {
  SpotApiCreateTransactionRequest,
  SpotApiLandingMethod,
  createSpotTransaction,
  landSpotTransaction,
} from '@/clients/spotApi';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';

export const useSpotTransactionSubmit = () => {
  const { localSolanaKeypair, solanaAddress, canDeriveSolanaWallet } = useAccounts();
  const spotApiEndpoint = useEndpointsConfig().spotApi;

  return useMutation({
    mutationFn: wrapAndLogBonsaiError(async (request: SpotApiCreateTransactionRequest) => {
      if (!canDeriveSolanaWallet) {
        throw new Error(
          'Spot trading is not available for Cosmos wallets. Please connect an Ethereum or Solana wallet.'
        );
      }

      if (!localSolanaKeypair || !solanaAddress) {
        throw new Error('Solana wallet not derived. Please reconnect your wallet.');
      }

      const requestWithAccount: SpotApiCreateTransactionRequest = {
        ...request,
        account: solanaAddress,
      };

      // Get unsigned transaction from backend
      const createResponse = await createSpotTransaction(spotApiEndpoint, requestWithAccount);

      // Deserialize and sign with derived Solana keypair
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(createResponse.transaction, 'base64')
      );
      transaction.sign([localSolanaKeypair]);

      // Submit signed transaction (backend expects base58 encoding)
      const signedTransactionBase58 = bs58.encode(transaction.serialize());
      const landResponse = await landSpotTransaction(spotApiEndpoint, {
        signedTransaction: signedTransactionBase58,
        expectedTokenMint: request.tokenMint,
        landingMethod: createResponse.metadata.jupiterRequestId
          ? SpotApiLandingMethod.JUPITER
          : undefined,
        jupiterRequestId: createResponse.metadata.jupiterRequestId,
        walletAddress: solanaAddress,
      });

      return {
        createResponse,
        landResponse,
      };
    }, 'spotTransactionSubmit'),
  });
};
