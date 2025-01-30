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
