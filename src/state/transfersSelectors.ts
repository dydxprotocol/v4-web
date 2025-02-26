import { DydxAddress } from '@/constants/wallets';

import { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { Deposit, isDeposit, isWithdraw, Transfer, Withdraw } from './transfers';

const getTransfersByAddress = (state: RootState) => state.transfers.transfersByDydxAddress;

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
