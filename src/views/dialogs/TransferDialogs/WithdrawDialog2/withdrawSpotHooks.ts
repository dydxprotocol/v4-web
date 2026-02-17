import { logBonsaiError, logBonsaiInfo, wrapAndLogBonsaiError } from '@/bonsai/logs';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AnalyticsEvents } from '@/constants/analytics';
import {
  MIN_SOL_RESERVE,
  SOL_WITHDRAWAL_POLL_INTERVAL_MS,
  SOL_WITHDRAWAL_TIMEOUT_MS,
} from '@/constants/spot';
import { timeUnits } from '@/constants/time';

import { useAccounts } from '@/hooks/useAccounts';
import { useSolanaConnection } from '@/hooks/useSolanaConnection';

import { track } from '@/lib/analytics/analytics';
import { promiseWithTimeout } from '@/lib/asyncUtils';
import { startTimer } from '@/lib/simpleTimer';
import { sleep } from '@/lib/timeUtils';

export const useWithdrawSol = () => {
  const { localSolanaKeypair, solanaAddress } = useAccounts();
  const connection = useSolanaConnection();

  const withdrawSol = async ({
    amount,
    destinationAddress,
  }: {
    amount: string;
    destinationAddress: string;
  }) => {
    const totalTimer = startTimer();
    const timingMs: Record<string, number> = {};

    let step: 'validateWallet' | 'sendTransaction' | 'confirmTransaction' = 'validateWallet';

    const solAmount = parseFloat(amount);
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

    logBonsaiInfo('spot/useWithdrawSol', 'Starting SOL withdrawal', {
      solAmount,
      destinationAddress,
      lamports,
      solanaAddress,
    });
    track(AnalyticsEvents.SpotSolWithdrawalStarted({ solAmount }));

    try {
      if (!localSolanaKeypair || !solanaAddress) {
        throw new Error('Solana wallet not available');
      }

      const sourcePubkey = new PublicKey(solanaAddress);
      const destPubkey = new PublicKey(destinationAddress);

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

      step = 'sendTransaction';
      const sendTimer = startTimer();
      const signature = await connection.sendRawTransaction(transaction.serialize());
      timingMs.sendTransactionMs = sendTimer.elapsed();

      step = 'confirmTransaction';
      const confirmTimer = startTimer();
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
      timingMs.confirmTransactionMs = confirmTimer.elapsed();

      timingMs.totalMs = totalTimer.elapsed();
      logBonsaiInfo('spot/useWithdrawSol', 'Successfully withdrew SOL', {
        signature,
        solAmount,
        destinationAddress,
        lamports,
        timingMs,
      });
      track(AnalyticsEvents.SpotSolWithdrawalSuccess({ solAmount, timingMs }));

      return { signature };
    } catch (error) {
      timingMs.totalMs = totalTimer.elapsed();

      const errorName = error instanceof Error ? error.name : 'UnknownError';
      const errorMessage = error instanceof Error ? error.message : String(error);

      logBonsaiError('spot/useWithdrawSol', 'SOL withdrawal failed', {
        error,
        solAmount,
        destinationAddress,
        lamports,
        step,
        timingMs,
        errorName,
        errorMessage,
      });
      track(AnalyticsEvents.SpotSolWithdrawalError({ solAmount, step, errorName, errorMessage }));

      throw error;
    }
  };

  return useMutation({
    mutationFn: withdrawSol,
  });
};

export const useSolBalance = () => {
  const { solanaAddress } = useAccounts();
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: ['connectionSolBalance', solanaAddress],
    queryFn: wrapAndLogBonsaiError(async () => {
      if (!solanaAddress) return '0';
      const lamports = await connection.getBalance(new PublicKey(solanaAddress));
      return (lamports / LAMPORTS_PER_SOL).toString();
    }, 'spot/connectionSolBalance'),
    enabled: Boolean(solanaAddress),
    refetchInterval: timeUnits.second * 60,
  });
};

export const useMaxWithdrawableSol = () => {
  const { data: solBalance } = useSolBalance();
  return solBalance ? Math.max(parseFloat(solBalance) - MIN_SOL_RESERVE, 0) : 0;
};
