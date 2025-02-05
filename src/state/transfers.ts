import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TokenForTransfer } from '@/constants/tokens';
import { DydxAddress } from '@/constants/wallets';

export type Deposit = {
  type: 'deposit';
  txHash: string;
  chainId: string;
  status: 'pending' | 'success' | 'error';
  token: TokenForTransfer;
  tokenAmount: string; // raw and unformatted amount
  estimatedAmountUsd: string;
  finalAmountUsd?: string;
  isInstantDeposit: boolean;
};

export type Withdraw = {
  type: 'withdraw';
  txHash: string;
  chainId: string;
  status: 'pending' | 'success' | 'error';
  estimatedAmountUsd: string;
  finalAmountUsd?: string;
  isInstantWithdraw: boolean;
};

export type Transfer = Deposit | Withdraw;

export function isDeposit(transfer: Transfer): transfer is Deposit {
  return transfer.type === 'deposit';
}

export function isWithdraw(transfer: Transfer): transfer is Withdraw {
  return transfer.type === 'withdraw';
}

export interface TransferState {
  transfersByDydxAddress: { [account: DydxAddress]: Transfer[] };
}

const initialState: TransferState = {
  transfersByDydxAddress: {},
};

export const transfersSlice = createSlice({
  name: 'Transfers',
  initialState,
  reducers: {
    addDeposit: (state, action: PayloadAction<{ dydxAddress: DydxAddress; deposit: Deposit }>) => {
      const { dydxAddress, deposit } = action.payload;
      if (!state.transfersByDydxAddress[dydxAddress]) {
        state.transfersByDydxAddress[dydxAddress] = [];
      }

      state.transfersByDydxAddress[dydxAddress].push(deposit);
    },
    updateDeposit: (
      state,
      action: PayloadAction<{
        dydxAddress: DydxAddress;
        deposit: Partial<Deposit> & { txHash: string; chainId: string };
      }>
    ) => {
      const { dydxAddress, deposit } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[dydxAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[dydxAddress] = accountTransfers.map((transfer) => {
        if (
          isDeposit(transfer) &&
          transfer.txHash === deposit.txHash &&
          transfer.chainId === deposit.chainId
        ) {
          return { ...transfer, ...deposit };
        }

        return transfer;
      });
    },
    addWithdraw: (
      state,
      action: PayloadAction<{ dydxAddress: DydxAddress; withdraw: Withdraw }>
    ) => {
      const { dydxAddress, withdraw } = action.payload;
      if (!state.transfersByDydxAddress[dydxAddress]) {
        state.transfersByDydxAddress[dydxAddress] = [];
      }

      state.transfersByDydxAddress[dydxAddress].push(withdraw);
    },
    updateWithdraw: (
      state,
      action: PayloadAction<{
        dydxAddress: DydxAddress;
        withdraw: Partial<Withdraw> & { txHash: string; chainId: string };
      }>
    ) => {
      const { dydxAddress, withdraw } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[dydxAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[dydxAddress] = accountTransfers.map((transfer) => {
        if (
          isWithdraw(transfer) &&
          transfer.txHash === withdraw.txHash &&
          transfer.chainId === withdraw.chainId
        ) {
          return { ...transfer, ...withdraw };
        }

        return transfer;
      });
    },
  },
});

export const { addDeposit, addWithdraw, updateDeposit, updateWithdraw } = transfersSlice.actions;
