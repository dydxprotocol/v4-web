import { useEffect, useRef } from 'react';

import { StatusState } from '@skip-go/client';
import { formatUnits } from 'viem';

import { AnalyticsEvents } from '@/constants/analytics';
import { USDC_DECIMALS } from '@/constants/tokens';

import { store } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch } from '@/state/appTypes';
import { isDeposit, isWithdraw, updateDeposit, updateWithdraw, Withdraw } from '@/state/transfers';
import { selectPendingTransfers } from '@/state/transfersSelectors';

import { track } from '@/lib/analytics/analytics';
import { log } from '@/lib/telemetry';

import { useSkipClient } from './transfers/skipClient';
import { useAccounts } from './useAccounts';
import { useParameterizedSelector } from './useParameterizedSelector';

export function useUpdateTransfers() {
  const { dydxAddress } = useAccounts();
  const dispatch = useAppDispatch();
  const { skipClient } = useSkipClient();

  const pendingTransfers = useParameterizedSelector(selectPendingTransfers, dydxAddress);
  // keep track of the transactions for which we've already started querying for statuses
  const transactionToCallback = useRef<{ [key: string]: boolean }>({});

  const getSubtransactionAndIdx = (withdraw: Withdraw) => {
    const subtransaction = withdraw.transactions.find(
      ({ status }) => status === 'pending' || status === 'idle'
    );

    const subtransactionIdx = withdraw.transactions.findIndex(
      ({ status }) => status === 'pending' || status === 'idle'
    );

    return { subtransaction, subtransactionIdx };
  };

  useEffect(() => {
    if (!dydxAddress || !pendingTransfers.length) return;

    for (let i = 0; i < pendingTransfers.length; i += 1) {
      const transfer = pendingTransfers[i]!;

      if (isDeposit(transfer)) {
        const { chainId, txHash } = transfer;
        const transferKey = `${chainId}-${txHash}`;
        if (transactionToCallback.current[transferKey]) continue;

        transactionToCallback.current[transferKey] = true;

        skipClient
          .waitForTransaction({
            chainID: chainId,
            txHash,
            async onTransactionTracked(txInfo) {
              if (!txInfo.explorerLink) return;
              dispatch(
                updateDeposit({
                  dydxAddress,
                  deposit: {
                    ...transfer,
                    explorerLink: txInfo.explorerLink,
                  },
                })
              );
            },
          })
          .then((response) => {
            // Assume the final asset transfer is always USDC
            const finalAmount = response.transferAssetRelease?.amount
              ? formatUnits(BigInt(response.transferAssetRelease.amount), USDC_DECIMALS)
              : undefined;

            const status = handleResponseStatus(response.status);
            const { token, ...rest } = transfer;

            dispatch(
              updateDeposit({
                dydxAddress,
                deposit: {
                  ...transfer,
                  finalAmountUsd: finalAmount,
                  status,
                },
              })
            );

            if (status === 'success') {
              track(
                AnalyticsEvents.DepositFinalized({
                  ...rest,
                  tokenInChainId: token.chainId,
                  tokenInDenom: token.denom,
                  status,
                  finalAmountUsd: finalAmount,
                })
              );

              appQueryClient.invalidateQueries({
                queryKey: ['validator', 'accountBalances'],
                exact: false,
              });
            }
          })
          .catch((error) => {
            log('useUpdateTransfers/deposit', error);
          });
      }

      if (isWithdraw(transfer)) {
        const { transactions } = transfer;
        const hasError = transactions.some((tx) => tx.status === 'error');

        if (!hasError) {
          const { subtransaction: trackedSubtransaction } = getSubtransactionAndIdx(transfer);

          if (trackedSubtransaction && trackedSubtransaction.txHash) {
            const chainId = trackedSubtransaction.chainId;
            const txHash = trackedSubtransaction.txHash;
            const transferKey = `${chainId}-${txHash}`;
            if (transactionToCallback.current[transferKey]) continue;

            transactionToCallback.current[transferKey] = true;

            skipClient
              .waitForTransaction({
                chainID: chainId,
                txHash,
                async onTransactionTracked(txInfo) {
                  if (!txInfo.explorerLink) return;
                  const subTransactions = transfer.transactions.map((t) => {
                    if (t.txHash === txInfo.txHash) {
                      return {
                        ...t,
                        explorerLink: txInfo.explorerLink,
                      };
                    }

                    return t;
                  });

                  dispatch(
                    updateWithdraw({
                      dydxAddress,
                      withdraw: {
                        ...transfer,
                        transactions: subTransactions,
                      },
                    })
                  );
                },
              })
              .then((response) => {
                const latestTransfer =
                  store
                    .getState()
                    .transfers.transfersByDydxAddress[
                      dydxAddress
                    ]?.find((t): t is Withdraw => isWithdraw(t) && t.id === transfer.id) ??
                  transfer;

                const { subtransaction, subtransactionIdx } =
                  getSubtransactionAndIdx(latestTransfer);

                // Assume the final asset transfer is always USDC
                const finalAmount = latestTransfer.transferAssetRelease?.amount
                  ? formatUnits(BigInt(latestTransfer.transferAssetRelease.amount), USDC_DECIMALS)
                  : undefined;

                const currentTransactionStatus = handleResponseStatus(response.status);
                const currentTransactionError = currentTransactionStatus === 'error';
                const transactionsCopy = [...latestTransfer.transactions];

                if (!subtransaction) {
                  throw new Error('No subtransaction found');
                }

                transactionsCopy[subtransactionIdx] = {
                  ...subtransaction,
                  status: currentTransactionStatus,
                };

                const hasPending = transactionsCopy.some(
                  (tx) => tx.status === 'pending' || tx.status === 'idle'
                );

                const status = currentTransactionError
                  ? 'error'
                  : hasPending
                    ? 'pending'
                    : 'success';

                dispatch(
                  updateWithdraw({
                    dydxAddress,
                    withdraw: {
                      ...latestTransfer,
                      transactions: transactionsCopy,
                      finalAmountUsd: finalAmount,
                      status,
                    },
                  })
                );

                if (status === 'success') {
                  track(
                    AnalyticsEvents.WithdrawFinalized({
                      ...transfer,
                      finalAmountUsd: finalAmount,
                      status,
                      transferAssetRelease: response.transferAssetRelease,
                    })
                  );

                  appQueryClient.invalidateQueries({
                    queryKey: ['validator', 'accountBalances'],
                    exact: false,
                  });
                }
              })
              .catch((error) => {
                log('useUpdateTransfers/withdraw', error);
              });
          }
        }
      }
    }
  }, [dydxAddress, pendingTransfers, skipClient, dispatch]);
}

function handleResponseStatus(status: StatusState) {
  switch (status) {
    case 'STATE_ABANDONED':
    case 'STATE_COMPLETED_ERROR':
    case 'STATE_PENDING_ERROR':
    case 'STATE_UNKNOWN':
      return 'error';
    case 'STATE_COMPLETED':
    case 'STATE_COMPLETED_SUCCESS':
      return 'success';
    default:
      return 'pending';
  }
}
