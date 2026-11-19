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
  // Multi-tx routes (e.g. Base -> Injective -> dYdX) broadcast one tx per signing chain.
  // `txHash`/`chainId` above stay the origin tx; every broadcast tx is listed here in order.
  txsRequired?: number;
  transactions?: WithdrawSubtransaction[];
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
  transferAssetRelease: TransferAssetRelease | null | undefined; // Where the asset was transferred to
  status: 'pending' | 'success' | 'error';
  updatedAt?: number;
  txHash: string;
};

export type Transfer = Deposit | Withdraw;

// Ids of deposits whose route is still executing in this session (depositHooks adds and removes
// them). After a reload this is empty, which tells the tracker a multi-tx deposit whose next tx
// was never broadcast will not progress any further.
export const inFlightDepositIds = new Set<string>();

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
    onDepositBroadcast: (
      state,
      action: PayloadAction<{
        dydxAddress: DydxAddress;
        depositId: string;
        subtransaction: WithdrawSubtransaction;
      }>
    ) => {
      const { dydxAddress, depositId, subtransaction } = action.payload;
      // Mutate in place (Immer) so a no-op update leaves state untouched and does not
      // re-trigger the transfer tracking effect.
      const deposit = state.transfersByDydxAddress[dydxAddress]?.find(
        (t): t is Deposit => isDeposit(t) && t.id === depositId
      );
      if (!deposit) return;

      deposit.transactions ??= [];
      const existing = deposit.transactions.find((tx) => tx.txHash === subtransaction.txHash);
      if (existing) {
        // Already recorded: only fill in the explorer link, never reset its status.
        if (subtransaction.explorerLink && !existing.explorerLink) {
          existing.explorerLink = subtransaction.explorerLink;
        }
        return;
      }

      deposit.transactions.push(subtransaction);
      deposit.updatedAt = Date.now();
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

export const {
  addDeposit,
  addWithdraw,
  onDepositBroadcast,
  onWithdrawBroadcast,
  updateDeposit,
  updateWithdraw,
} = transfersSlice.actions;
