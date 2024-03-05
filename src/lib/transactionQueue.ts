import Abacus from '@dydxprotocol/v4-abacus';

import {
  type HumanReadableCancelOrderPayload,
  type HumanReadablePlaceOrderPayload,
  type TransactionTypes,
  TransactionType,
} from '@/constants/abacus';

interface TransactionParams {
  type: TransactionTypes;
  callback: (p0: Abacus.Nullable<string>) => void;
}

interface PlaceOrderParams extends TransactionParams {
  payload: HumanReadablePlaceOrderPayload;
}

interface CancelOrderParams extends TransactionParams {
  payload: HumanReadableCancelOrderPayload;
}

type AnyTransactionParams = PlaceOrderParams | CancelOrderParams;

class TransactionQueue {
  private queue: Array<{ params: AnyTransactionParams; status: string }>;
  private isProcessing: boolean;

  private placeOrder: (params: HumanReadablePlaceOrderPayload) => Promise<string>;
  private cancelOrder: (params: HumanReadableCancelOrderPayload) => Promise<string>;

  constructor(
    placeOrder: (params: HumanReadablePlaceOrderPayload) => Promise<string>,
    cancelOrder: (params: HumanReadableCancelOrderPayload) => Promise<string>
  ) {
    this.queue = [];
    this.isProcessing = false;

    this.placeOrder = placeOrder;
    this.cancelOrder = cancelOrder;
  }

  enqueue(params: AnyTransactionParams): void {
    this.queue.push({
      params,
      status: 'pending',
    });
    this.processQueue();
  }


  private dequeue(): void {
    this.queue.shift();
  }

  private peek(): { params: AnyTransactionParams; status: string } | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const currentTransaction = this.peek();

      if (currentTransaction && currentTransaction.status === 'pending') {
        try {
          const result = await this.sendTransaction(currentTransaction.params);
          currentTransaction.params.callback(result);
          currentTransaction.status = 'sent';
        } catch (error) {
          // Expected errors are handled within the transaction functions
          // log
          currentTransaction.status = 'failed';
        } finally {
          this.dequeue();
        }
      }
    }

    this.isProcessing = false;
  }

  private async sendTransaction(params: AnyTransactionParams): Promise<any> {
    switch (params.type) {
      case TransactionType.PlaceOrder:
        return this.placeOrder((params as PlaceOrderParams).payload);
      case TransactionType.CancelOrder:
        return this.cancelOrder((params as CancelOrderParams).payload);
      default:
        throw new Error('Unsupported transaction type');
    }
  }
}

export default TransactionQueue;
