import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DydxAddress } from '@/constants/wallets';

export type Deposit = {
  type: 'deposit';
  txHash: string;
  chainId: string;
  status: 'pending' | 'success' | 'error';
  estimatedAmountUsd: string;
  actualAmountUsd?: string;
  isInstantDeposit: boolean;
};

export type Withdraw = {
  type: 'withdraw';
  // TODO: add withdraw details here
};

type Transfer = Deposit | Withdraw;

export interface TransferState {
  accountToTransfers: { [account: DydxAddress]: Transfer[] };
}

const initialState: TransferState = {
  accountToTransfers: {},
};

export const transfersSlice = createSlice({
  name: 'Transfers',
  initialState,
  reducers: {
    addDeposit: (state, action: PayloadAction<{ dydxAddress: DydxAddress; deposit: Deposit }>) => {
      const { dydxAddress, deposit } = action.payload;
      if (!state.accountToTransfers[dydxAddress]) {
        state.accountToTransfers[dydxAddress] = [];
      }

      state.accountToTransfers[dydxAddress].push(deposit);
    },
    updateDeposit: (
      state,
      action: PayloadAction<{
        dydxAddress: DydxAddress;
        deposit: Partial<Deposit> & { txHash: string; chainId: string };
      }>
    ) => {
      const { dydxAddress, deposit } = action.payload;
      const accountTransfers = state.accountToTransfers[dydxAddress];
      if (!accountTransfers?.length) return;

      state.accountToTransfers[dydxAddress] = accountTransfers.map((transfer) => {
        if (
          transfer.type === 'deposit' &&
          transfer.txHash === deposit.txHash &&
          transfer.chainId === deposit.chainId
        ) {
          return { ...transfer, ...deposit };
        }

        return transfer;
      });
    },
  },
});

export const { addDeposit, updateDeposit } = transfersSlice.actions;
