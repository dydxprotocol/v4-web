import { wrapAndLogBonsaiError } from '@/bonsai/logs';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  MIN_SOL_RESERVE,
  SOL_WITHDRAWAL_POLL_INTERVAL_MS,
  SOL_WITHDRAWAL_TIMEOUT_MS,
} from '@/constants/spot';
import { timeUnits } from '@/constants/time';

import { useAccounts } from '@/hooks/useAccounts';
import { useSolanaConnection } from '@/hooks/useSolanaConnection';

import { promiseWithTimeout } from '@/lib/asyncUtils';
import { sleep } from '@/lib/timeUtils';

export const useWithdrawSol = () => {
  const { localSolanaKeypair, solanaAddress } = useAccounts();
  const connection = useSolanaConnection();

  return useMutation({
    mutationFn: wrapAndLogBonsaiError(
      async ({ amount, destinationAddress }: { amount: string; destinationAddress: string }) => {
        if (!localSolanaKeypair || !solanaAddress) {
          throw new Error('Solana wallet not available');
        }

        const sourcePubkey = new PublicKey(solanaAddress);
        const destPubkey = new PublicKey(destinationAddress);
        const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sourcePubkey,
            toPubkey: destPubkey,
            lamports,
          })
        );

        transaction.feePayer = sourcePubkey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        transaction.sign(localSolanaKeypair);

        const signature = await connection.sendRawTransaction(transaction.serialize());

        const pollForConfirmation = async (): Promise<void> => {
          // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
          while (true) {
            // eslint-disable-next-line no-await-in-loop
            const status = await connection.getSignatureStatus(signature);

            if (
              status.value?.confirmationStatus === 'confirmed' ||
              status.value?.confirmationStatus === 'finalized'
            ) {
              return;
            }

            if (status.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }

            // eslint-disable-next-line no-await-in-loop
            await sleep(SOL_WITHDRAWAL_POLL_INTERVAL_MS);
          }
        };

        await promiseWithTimeout(
          pollForConfirmation(),
          SOL_WITHDRAWAL_TIMEOUT_MS,
          'Transaction confirmation timeout'
        );

        return { signature };
      },
      'spotWithdrawSol'
    ),
  });
};

export const useSolBalance = () => {
  const { solanaAddress } = useAccounts();
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: ['solBalance', solanaAddress],
    queryFn: async () => {
      if (!solanaAddress) return '0';
      const lamports = await connection.getBalance(new PublicKey(solanaAddress));
      return (lamports / LAMPORTS_PER_SOL).toString();
    },
    enabled: Boolean(solanaAddress),
    refetchInterval: timeUnits.second * 60,
  });
};

export const useMaxWithdrawableSol = () => {
  const { data: solBalance } = useSolBalance();
  return solBalance ? Math.max(parseFloat(solBalance) - MIN_SOL_RESERVE, 0) : 0;
};
