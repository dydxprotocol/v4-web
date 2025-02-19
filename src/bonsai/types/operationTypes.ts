import { ofType, unionize, UnionOf } from 'unionize';

export type DepositUsdcProps = {
  subaccountNumber: number;
  amount: string;
};

export type WithdrawUsdcProps = {
  subaccountNumber: number;
  amount: string;
};

export type SubaccountTransferProps = {
  senderSubaccountNumber: number;
  recipientSubaccountNumber: number;
  amount: string;
};

// Define the union of operations
export const SubaccountOperations = unionize(
  {
    DepositUsdc: ofType<DepositUsdcProps>(),
    WithdrawUsdc: ofType<WithdrawUsdcProps>(),
    SubaccountTransfer: ofType<SubaccountTransferProps>(),
  },
  { tag: 'operation' as const, value: 'payload' as const }
);

export type SubaccountOperation = UnionOf<typeof SubaccountOperations>;

export interface SubaccountBatchedOperations {
  operations: SubaccountOperation[];
}
