import { DydxAddress } from '@/constants/wallets';

import { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { Deposit } from './transfers';

const getTransfersByAddress = (state: RootState) => state.transfers.transfersByDydxAddress;

export const selectPendingDeposits = () =>
  createAppSelector(
    [getTransfersByAddress, (s, dydxAddress?: DydxAddress) => dydxAddress],
    (transfersByAddress, dydxAddress): Deposit[] => {
      if (!dydxAddress || !transfersByAddress[dydxAddress]) return [];

      return transfersByAddress[dydxAddress].filter(
        (transfer) => transfer.type === 'deposit' && transfer.status === 'pending'
      ) as Deposit[];
    }
  );

const selectAllTransfers = createAppSelector(
  [(state: RootState) => state.transfers.transfersByDydxAddress],
  (transfersByDydxAddress) => Object.values(transfersByDydxAddress).flat()
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
        (transfer) =>
          transfer.type === 'deposit' && transfer.txHash === txHash && transfer.chainId === chainId
      ) as Deposit | undefined;
    }
  );
