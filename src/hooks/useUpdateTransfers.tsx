import { useEffect, useRef } from 'react';

import { logBonsaiInfo } from '@/bonsai/logs';
import { TransactionState } from '@skip-go/client';
import { formatUnits } from 'viem';

import { AnalyticsEvents } from '@/constants/analytics';
import { USDC_DECIMALS } from '@/constants/tokens';

import { store } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch } from '@/state/appTypes';
import {
  Deposit,
  inFlightDepositIds,
  isDeposit,
  isWithdraw,
  onDepositBroadcast,
  updateDeposit,
  updateWithdraw,
  Withdraw,
} from '@/state/transfers';
import { selectPendingTransfers } from '@/state/transfersSelectors';

import { track } from '@/lib/analytics/analytics';
import { log } from '@/lib/telemetry';

import { useSkipClient } from './transfers/skipClient';
import { useAccounts } from './useAccounts';
import { useAppSelectorWithArgs } from './useParameterizedSelector';

export function useUpdateTransfers() {
  const { dydxAddress } = useAccounts();
  const dispatch = useAppDispatch();
  const { skipClient } = useSkipClient();

  const pendingTransfers = useAppSelectorWithArgs(selectPendingTransfers, dydxAddress);
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
        // Multi-tx routes (e.g. Base -> Injective -> dYdX) list every broadcast tx in
        // `transactions`. Track the latest pending one; the deposit completes when the last
        // required tx succeeds. Single-tx deposits track the origin tx as before.
        const txsRequired = transfer.txsRequired ?? 1;
        const isMultiTx = txsRequired > 1 && !!transfer.transactions?.length;
        const target = isMultiTx
          ? [...transfer.transactions!].reverse().find((tx) => tx.txHash && tx.status === 'pending')
          : { chainId: transfer.chainId, txHash: transfer.txHash };

        if (!target?.txHash) {
          // Earlier legs are done but the next tx was never broadcast, and the route is no
          // longer executing (e.g. the app was reloaded before signing it). Funds are on an
          // intermediate chain and nothing will move them, so stop showing it as pending.
          if (
            isMultiTx &&
            transfer.transactions!.length < txsRequired &&
            !inFlightDepositIds.has(transfer.id)
          ) {
            dispatch(
              updateDeposit({
                dydxAddress,
                deposit: { txHash: transfer.txHash, chainId: transfer.chainId, status: 'error' },
              })
            );
          }
          continue;
        }

        const { chainId, txHash } = target;
        const transferKey = `${chainId}-${txHash}`;
        if (transactionToCallback.current[transferKey]) continue;

        transactionToCallback.current[transferKey] = true;
        let lastState: TransactionState | undefined;

        const getLatestDeposit = () =>
          store
            .getState()
            .transfers.transfersByDydxAddress[
              dydxAddress
            ]?.find((t): t is Deposit => isDeposit(t) && t.id === transfer.id) ?? transfer;

        skipClient
          .waitForTransaction({
            chainId,
            txHash,
            onStatusUpdated(txStatus) {
              lastState = txStatus.state;
            },
            async onTransactionTracked(txInfo) {
              if (!txInfo.explorerLink) return;
              // The deposit-level link stays the origin tx; later txs keep their own link.
              if (txHash === transfer.txHash && chainId === transfer.chainId) {
                dispatch(
                  updateDeposit({
                    dydxAddress,
                    deposit: { txHash, chainId, explorerLink: txInfo.explorerLink },
                  })
                );
              }
              if (isMultiTx) {
                dispatch(
                  onDepositBroadcast({
                    dydxAddress,
                    depositId: transfer.id,
                    subtransaction: {
                      txHash,
                      chainId,
                      status: 'pending',
                      explorerLink: txInfo.explorerLink,
                    },
                  })
                );
              }
            },
          })
          .then((response) => {
            // Assume the final asset transfer is always USDC
            const finalAmount = response.transferAssetRelease?.amount
              ? formatUnits(BigInt(response.transferAssetRelease.amount), USDC_DECIMALS)
              : undefined;

            // `status` is deprecated on the response; `state` is what waitForTransaction checks.
            const txStatus: Deposit['status'] = handleResponseStatus(response.state);
            const { token, ...rest } = transfer;
            let status: Deposit['status'] = txStatus;

            if (isMultiTx) {
              const latestDeposit = getLatestDeposit();
              // A late result for an earlier leg must not reopen a finished deposit.
              if (latestDeposit.status !== 'pending') return;

              const transactions = (latestDeposit.transactions ?? []).map((tx) =>
                tx.txHash === txHash ? { ...tx, status: txStatus } : tx
              );
              const isLastTx =
                transactions.length >= (latestDeposit.txsRequired ?? 1) &&
                transactions[transactions.length - 1]?.txHash === txHash;

              // An earlier leg succeeding only means funds reached the intermediate chain.
              status = txStatus === 'success' && !isLastTx ? 'pending' : txStatus;
              const finalTransactions =
                status === 'success'
                  ? transactions.map((tx) => ({ ...tx, status: 'success' as const }))
                  : transactions;

              dispatch(
                updateDeposit({
                  dydxAddress,
                  deposit: {
                    txHash: latestDeposit.txHash,
                    chainId: latestDeposit.chainId,
                    transactions: finalTransactions,
                    finalAmountUsd: status === 'success' ? finalAmount : undefined,
                    status,
                  },
                })
              );
            } else {
              dispatch(
                updateDeposit({
                  dydxAddress,
                  deposit: {
                    txHash: transfer.txHash,
                    chainId: transfer.chainId,
                    finalAmountUsd: finalAmount,
                    status,
                  },
                })
              );
            }

            if (status === 'success') {
              logBonsaiInfo('useUpdateTransfers', 'deposit finalized', {
                ...rest,
                tokenInChainId: token.chainId,
                tokenInDenom: token.denom,
                status,
                finalAmountUsd: finalAmount,
              });
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

            // waitForTransaction throws once Skip reports a terminal failure (e.g. a later leg
            // rejected with "timeout elapsed"). Without this the deposit stays pending forever.
            if (lastState === 'STATE_COMPLETED_ERROR' || lastState === 'STATE_ABANDONED') {
              const latestDeposit = getLatestDeposit();
              if (latestDeposit.status !== 'pending') return;
              dispatch(
                updateDeposit({
                  dydxAddress,
                  deposit: {
                    txHash: transfer.txHash,
                    chainId: transfer.chainId,
                    status: 'error',
                    ...(isMultiTx && {
                      transactions: (latestDeposit.transactions ?? []).map((tx) =>
                        tx.txHash === txHash ? { ...tx, status: 'error' as const } : tx
                      ),
                    }),
                  },
                })
              );
              return;
            }

            // Not a terminal state (e.g. a network error while polling): allow tracking again.
            delete transactionToCallback.current[transferKey];
          });
      }

      if (isWithdraw(transfer)) {
        const { transactions } = transfer;
        const hasError = transactions.some((tx) => tx.status === 'error');

        if (!hasError) {
          const { subtransaction: trackedSubtransaction } = getSubtransactionAndIdx(transfer);
          const originSubtransaction = transfer.transactions[0];
          const isTrackingOrigin = trackedSubtransaction != null && !trackedSubtransaction.txHash;
          const target = isTrackingOrigin ? originSubtransaction : trackedSubtransaction;

          if (trackedSubtransaction && target?.txHash) {
            const chainId = target.chainId;
            const txHash = target.txHash;
            const transferKey = `${chainId}-${txHash}`;
            if (transactionToCallback.current[transferKey]) continue;

            transactionToCallback.current[transferKey] = true;

            skipClient
              .waitForTransaction({
                chainId,
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
                const finalAmount = response.transferAssetRelease?.amount
                  ? formatUnits(BigInt(response.transferAssetRelease.amount), USDC_DECIMALS)
                  : undefined;

                const currentTransactionStatus = handleResponseStatus(response.status);
                const currentTransactionError = currentTransactionStatus === 'error';
                const isRouteComplete =
                  currentTransactionStatus === 'success' &&
                  response.transferAssetRelease?.released === true;

                if (!subtransaction) {
                  throw new Error('No subtransaction found');
                }

                let transactionsCopy = [...latestTransfer.transactions];

                if (isRouteComplete) {
                  // Skip has released the asset at the destination, so every hop has succeeded
                  transactionsCopy = transactionsCopy.map((tx) =>
                    tx.status === 'pending' || tx.status === 'idle'
                      ? { ...tx, status: 'success' as const }
                      : tx
                  );
                } else if (!isTrackingOrigin || currentTransactionError) {
                  transactionsCopy[subtransactionIdx] = {
                    ...subtransaction,
                    status: currentTransactionStatus,
                  };
                }

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
                      transferAssetRelease: response.transferAssetRelease,
                      status,
                    },
                  })
                );

                if (status === 'success') {
                  logBonsaiInfo('useUpdateTransfers', 'withdraw finalized', {
                    ...latestTransfer,
                    finalAmountUsd: finalAmount,
                    status,
                    transferAssetRelease: response.transferAssetRelease,
                  });
                  track(
                    AnalyticsEvents.WithdrawFinalized({
                      ...latestTransfer,
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

function handleResponseStatus(status: TransactionState | string | undefined) {
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
