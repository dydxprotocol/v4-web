import { selectParentSubaccountInfo } from '@/bonsai/socketSelectors';

import { EMPTY_ARR } from '@/constants/objects';
import { TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED } from '@/constants/transfers';
import { DydxAddress } from '@/constants/wallets';

import type { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { Deposit, isDeposit, isWithdraw, Transfer, Withdraw } from './transfers';

export const getTransfersByAddress = (state: RootState) => state.transfers.transfersByDydxAddress;

export const selectPendingTransfers = () => {
  return createAppSelector(
    [getTransfersByAddress, (_s, dydxAddress?: DydxAddress) => dydxAddress],
    (transfersByAddress, dydxAddress): Transfer[] => {
      if (dydxAddress == null || !transfersByAddress[dydxAddress]) return [];
      return transfersByAddress[dydxAddress].filter((transfer) => transfer.status === 'pending');
    }
  );
};

export const selectPendingDeposits = () =>
  createAppSelector(
    [getTransfersByAddress, (s, dydxAddress?: DydxAddress) => dydxAddress],
    (transfersByAddress, dydxAddress): Deposit[] => {
      if (!dydxAddress || !transfersByAddress[dydxAddress]) return [];

      return transfersByAddress[dydxAddress].filter(
        (transfer): transfer is Deposit => isDeposit(transfer) && transfer.status === 'pending'
      );
    }
  );

export const selectPendingWithdraws = () =>
  createAppSelector(
    [getTransfersByAddress, (s, dydxAddress?: DydxAddress) => dydxAddress],
    (transfersByAddress, dydxAddress): Withdraw[] => {
      if (!dydxAddress || !transfersByAddress[dydxAddress]) return [];

      return transfersByAddress[dydxAddress].filter(
        (transfer): transfer is Withdraw => isWithdraw(transfer) && transfer.status === 'pending'
      );
    }
  );

const selectAllTransfers = createAppSelector([getTransfersByAddress], (transfersByDydxAddress) =>
  Object.values(transfersByDydxAddress).flat()
);

export const selectTransfersByAddress = () =>
  createAppSelector(
    [getTransfersByAddress, (s, dydxAddress?: DydxAddress) => dydxAddress],
    (transfersByAddress, dydxAddress): Transfer[] => {
      if (!dydxAddress) return [];
      return transfersByAddress[dydxAddress] ?? [];
    }
  );

export const selectDeposit = () =>
  createAppSelector(
    [
      selectAllTransfers,
      (s, txHash: string) => txHash,
      (s, txHash: string, chainId: string) => chainId,
    ],
    (allTransfers, txHash, chainId) => {
      return allTransfers.find(
        (transfer): transfer is Deposit =>
          isDeposit(transfer) && transfer.txHash === txHash && transfer.chainId === chainId
      );
    }
  );

export const selectTransfer = () =>
  createAppSelector([selectAllTransfers, (s, id: string) => id], (allTransfers, id) => {
    return allTransfers.find((transfer) => transfer.id === id);
  });

export const selectWithdraw = () =>
  createAppSelector([selectAllTransfers, (s, id: string) => id], (allTransfers, id) => {
    return allTransfers.find(
      (transfer): transfer is Withdraw => isWithdraw(transfer) && transfer.id === id
    );
  });

export const selectHasNonExpiredPendingWithdraws = createAppSelector(
  [selectParentSubaccountInfo, getTransfersByAddress],
  (parentSubaccountInfo, transfersByAddress) => {
    const pendingWithdraws = parentSubaccountInfo.wallet
      ? transfersByAddress[parentSubaccountInfo.wallet as DydxAddress]?.filter(isWithdraw) ??
        EMPTY_ARR
      : EMPTY_ARR;

    const idleTimes = pendingWithdraws.reduce<number[]>((acc, w) => {
      if (w.transactions.some((t) => t.status === 'idle')) {
        if (w.updatedAt) {
          return [...acc, w.updatedAt];
        }
      }

      return acc;
    }, []);

    return idleTimes.some((t) => t > Date.now() - TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED);
  }
);
