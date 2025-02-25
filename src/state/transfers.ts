import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransferAssetRelease } from '@skip-go/client';

import { TokenForTransfer } from '@/constants/tokens';
import { DydxAddress } from '@/constants/wallets';

export type Deposit = {
  id: string;
  type: 'deposit';
  txHash: string;
  chainId: string;
  status: 'pending' | 'success' | 'error';
  token: TokenForTransfer;
  tokenAmount: string; // raw and unformatted amount
  estimatedAmountUsd: string;
  finalAmountUsd?: string;
  isInstantDeposit: boolean;
  explorerLink?: string;
  updatedAt?: number;
};

export type WithdrawSubtransaction = {
  txHash?: string; // Optional due to not knowing the txHash until time of broadcast. (Withdraws may have several broadcasted transactions)
  chainId: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  explorerLink?: string;
};

export type Withdraw = {
  id: string;
  type: 'withdraw';
  transactions: WithdrawSubtransaction[];
  estimatedAmountUsd: string;
  finalAmountUsd?: string;
  isInstantWithdraw: boolean;
  destinationChainId: string;
  transferAssetRelease: TransferAssetRelease | null; // Where the asset was transferred to
  status: 'pending' | 'success' | 'error';
  updatedAt?: number;
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

      const newDeposit = { ...deposit, updatedAt: Date.now() };

      state.transfersByDydxAddress[dydxAddress].push(newDeposit);
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
          return { ...transfer, ...deposit, updatedAt: Date.now() };
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

      const newWithdraw = { ...withdraw, updatedAt: Date.now() };

      state.transfersByDydxAddress[dydxAddress].push(newWithdraw);
    },
    updateWithdraw: (
      state,
      action: PayloadAction<{
        dydxAddress: DydxAddress;
        withdraw: Partial<Withdraw>;
      }>
    ) => {
      const { dydxAddress, withdraw } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[dydxAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[dydxAddress] = accountTransfers.map((transfer) => {
        if (isWithdraw(transfer) && transfer.id === withdraw.id) {
          return { ...transfer, ...withdraw };
        }

        return transfer;
      });
    },
    onWithdrawBroadcast: (
      state,
      action: PayloadAction<{
        dydxAddress: DydxAddress;
        withdrawId: string;
        subtransaction: WithdrawSubtransaction;
      }>
    ) => {
      const { dydxAddress, withdrawId, subtransaction } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[dydxAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[dydxAddress] = accountTransfers.map((transfer) => {
        if (isWithdraw(transfer) && transfer.id === withdrawId) {
          const currentTransactions = transfer.transactions.map((sub) => {
            if (sub.chainId === subtransaction.chainId) {
              return {
                ...sub,
                ...subtransaction,
              };
            }

            return sub;
          });

          transfer.transactions = currentTransactions;
          transfer.updatedAt = Date.now();
        }

        return transfer;
      });
    },
  },
});

export const { addDeposit, addWithdraw, onWithdrawBroadcast, updateDeposit, updateWithdraw } =
  transfersSlice.actions;
