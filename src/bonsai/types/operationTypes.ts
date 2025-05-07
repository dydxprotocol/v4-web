import { OrderSide } from '@dydxprotocol/v4-client-js';
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

export type ApplyTradeProps = {
  subaccountNumber: number;
  marketId: string;
  marketOraclePrice: number;

  side: OrderSide;
  size: number;
  averagePrice: number;
  fee: number;
  reduceOnly: boolean;
};

// Define the union of operations
export const SubaccountOperations = unionize(
  {
    DepositUsdc: ofType<DepositUsdcProps>(),
    WithdrawUsdc: ofType<WithdrawUsdcProps>(),
    SubaccountTransfer: ofType<SubaccountTransferProps>(),
    SubaccountTransferFull: ofType<Omit<SubaccountTransferProps, 'amount'>>(),
    ApplyTrade: ofType<ApplyTradeProps>(),
  },
  { tag: 'operation' as const, value: 'payload' as const }
);

export type SubaccountOperation = UnionOf<typeof SubaccountOperations>;

export interface SubaccountBatchedOperations {
  operations: SubaccountOperation[];
}
