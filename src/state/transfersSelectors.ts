import { DydxAddress } from '@/constants/wallets';

import { RootState } from './_store';
import { Deposit } from './transfers';

/**
 * @returns saved chartConfig for TradingView
 */
export const getPendingDeposits = (state: RootState, dydxAddress?: DydxAddress): Deposit[] => {
  if (!dydxAddress || !state.transfers.accountToTransfers[dydxAddress]) return [];

  return state.transfers.accountToTransfers[dydxAddress].filter(
    (transfer) => transfer.type === 'deposit' && transfer.status === 'pending'
  ) as Deposit[];
};

export const getDeposit = (
  state: RootState,
  txHash: string,
  chainId: string
): Deposit | undefined => {
  const allTransfers = Object.values(state.transfers.accountToTransfers).flat();
  return allTransfers.find(
    (transfer) =>
      transfer.type === 'deposit' && transfer.txHash === txHash && transfer.chainId === chainId
  ) as Deposit;
};
