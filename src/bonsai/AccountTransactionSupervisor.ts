import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import {
  isOperationFailure,
  isOperationSuccess,
  OperationResult,
  wrapOperationFailure,
  wrapOperationSuccess,
} from '@/bonsai/lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import { OrderStatus } from '@/bonsai/types/summaryTypes';
import {
  CompositeClient,
  LocalWallet,
  OrderFlags,
  SubaccountClient,
} from '@dydxprotocol/v4-client-js';

import { type RootStore } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import {
  cancelAllOrderFailed,
  cancelAllSubmitted,
  cancelOrderFailed,
  cancelOrderSubmitted,
} from '@/state/localOrders';
import { getLocalWalletNonce } from '@/state/walletSelectors';

import { parseToPrimitives, ToPrimitives } from '@/lib/abacus/parseToPrimitives';
import { operationFailureToErrorParams, wrapSimpleError } from '@/lib/errorHelpers';
import { stringifyTransactionError } from '@/lib/errors';
import { localWalletManager } from '@/lib/hdKeyManager';
import { AttemptNumber } from '@/lib/numbers';
import { SerialTaskExecutor } from '@/lib/serialExecutor';

import { CompositeClientManager } from './rest/lib/compositeClientManager';

interface ClientWalletPair {
  compositeClient: CompositeClient;
  localWallet: LocalWallet;
}

interface CancelOrderPayload {
  clientId: number;
  orderFlags: OrderFlags;
  clobPairId: number;
  goodTilBlock: number | undefined;
  goodTilBlockTime: number | undefined;
  subaccountNumber: number;
}

export class AccountTransactionSupervisor {
  private store: RootStore;

  private compositeClientManager: typeof CompositeClientManager;

  private orderCancelExecutor: SerialTaskExecutor;

  private unsubscribes: Array<(() => void) | null> = [];

  constructor(store: RootStore, compositeClientManager: typeof CompositeClientManager) {
    this.store = store;
    this.compositeClientManager = compositeClientManager;
    this.orderCancelExecutor = new SerialTaskExecutor();

    this.subscribeToOrderUpdates();
  }

  private hasValidLocalWallet(): boolean {
    const state = this.store.getState();
    const localWalletNonce = getLocalWalletNonce(state);
    return localWalletNonce != null;
  }

  private doClientAndWalletOperation<T, Args extends any[]>(
    fn: (pair: ClientWalletPair, ...args: NoInfer<Args>) => Promise<T>
  ): (...args: Args) => Promise<T> {
    const nonceBefore = getLocalWalletNonce(this.store.getState());
    const networkBefore = getSelectedNetwork(this.store.getState());

    return async (...args: Args) => {
      const network = getSelectedNetwork(this.store.getState());
      const localWalletNonce = getLocalWalletNonce(this.store.getState());

      const clientConfig = {
        network,
        dispatch: this.store.dispatch,
      };
      const clientWrapper = this.compositeClientManager.use(clientConfig);

      try {
        if (network !== networkBefore) {
          throw new Error('Network changed before operation execution');
        }
        if (localWalletNonce !== nonceBefore) {
          throw new Error('Local wallet changed before operation execution');
        }
        if (localWalletNonce == null) {
          throw new Error('No valid local wallet nonce found');
        }

        const localWallet = localWalletManager.getLocalWallet(localWalletNonce);

        if (localWallet == null) {
          throw new Error('Local wallet not initialized or nonce was incorrect.');
        }

        // Wait for the composite client to be available
        const compositeClient = await clientWrapper.compositeClientPromise;

        // Execute the function with the client wallet pair
        return await fn({ compositeClient, localWallet }, ...args);
      } finally {
        // Always mark the client as done to prevent memory leaks
        this.compositeClientManager.markDone(clientConfig);
      }
    };
  }

  private wrapOperation<T, Payload>(
    nameForLogging: string,
    payload: Payload,
    fn: (payload: Payload) => Promise<T>
  ): () => Promise<OperationResult<ToPrimitives<T>>> {
    return async () => {
      try {
        logBonsaiInfo(nameForLogging, 'Attempting operation', { payload });

        const tx = await fn(payload);

        const parsedTx = parseToPrimitives(tx);

        logBonsaiInfo(nameForLogging, 'Successful operation', {
          payload,
          parsedTx,
        });

        return wrapOperationSuccess(parsedTx);
      } catch (error) {
        const errorString = stringifyTransactionError(error);
        const parsed = parseTransactionError(nameForLogging, errorString);
        logBonsaiError(nameForLogging, 'Failed operation', {
          payload,
          parsed,
          errorString,
        });

        return wrapOperationFailure(errorString, parsed);
      }
    };
  }

  private subscribeToOrderUpdates(): void {
    this.unsubscribes.push(
      this.store.subscribe(() => {
        // todo
      })
    );
  }

  private createCancelOrderPayload(orderId: string): CancelOrderPayload | undefined {
    const state = this.store.getState();
    const orders = BonsaiCore.account.allOrders.data(state);
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      logBonsaiError('AccountTransactionSupervisor/createCancelOrderPayload', 'Order not found', {
        orderId,
      });
      return undefined;
    }

    if (order.status === OrderStatus.Canceled) {
      logBonsaiInfo(
        'AccountTransactionSupervisor/createCancelOrderPayload',
        'Order already canceled',
        { orderId }
      );
      return undefined;
    }

    const clobPairId = order.clobPairId;
    const clientId = AttemptNumber(order.clientId);

    if (clientId == null || clobPairId == null) {
      logBonsaiError(
        'AccountTransactionSupervisor/createCancelOrderPayload',
        'Invalid client ID or CLOB pair ID',
        {
          orderId,
        }
      );
      return undefined;
    }

    let orderFlags: OrderFlags | undefined;

    switch (order.orderFlags) {
      case '0':
        orderFlags = OrderFlags.SHORT_TERM;
        break;
      case '32':
        orderFlags = OrderFlags.CONDITIONAL;
        break;
      case '64':
        orderFlags = OrderFlags.LONG_TERM;
        break;
      default:
        logBonsaiError(
          'AccountTransactionSupervisor/createCancelOrderPayload',
          'Unsupported order flags',
          {
            orderId,
            orderFlags: order.orderFlags,
          }
        );
        return undefined;
    }

    return {
      clientId,
      orderFlags,
      clobPairId,
      goodTilBlock: order.goodTilBlock ?? undefined,
      goodTilBlockTime: order.goodTilBlockTimeSeconds ?? undefined,
      subaccountNumber: order.subaccountNumber,
    };
  }

  private async executeCancelOrder(orderId: string) {
    const cancelPayload = this.createCancelOrderPayload(orderId);

    if (cancelPayload == null) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/executeCancelOrder',
        'Unable to create cancel payload for order'
      );
    }

    return this.wrapOperation(
      'AccountTransactionSupervisor/executeCancelOrder',
      cancelPayload,
      this.doClientAndWalletOperation(async ({ compositeClient, localWallet }, payload) => {
        // Create a SubaccountClient using the wallet and subaccount number
        const subaccountClient = new SubaccountClient(localWallet, cancelPayload.subaccountNumber);

        // Initiate the cancellation using cancelRawOrder
        return compositeClient.cancelRawOrder(
          subaccountClient,
          payload.clientId,
          payload.orderFlags,
          payload.clobPairId,
          payload.goodTilBlock === 0 ? undefined : payload.goodTilBlock,
          payload.goodTilBlockTime === 0 ? undefined : payload.goodTilBlockTime
        );
      })
    )();
  }

  private maybeNoLocalWalletError(fnName: string) {
    if (!this.hasValidLocalWallet()) {
      const errorMsg = 'No valid local wallet available';
      const errSource = `AccountTransactionSupervisor/${fnName}`;
      logBonsaiError(errSource, errorMsg);
      return wrapSimpleError(errSource, errorMsg);
    }
    return undefined;
  }

  public async cancelOrder({ orderId }: { orderId: string }) {
    const maybeErr = this.maybeNoLocalWalletError('cancelOrder');
    if (maybeErr) {
      return maybeErr;
    }

    // Dispatch action to track cancellation request
    this.store.dispatch(cancelOrderSubmitted(orderId));

    // Queue the cancellation to avoid race conditions
    const result = await this.orderCancelExecutor.enqueue(() => this.executeCancelOrder(orderId));

    if (isOperationFailure(result)) {
      this.store.dispatch(
        cancelOrderFailed({
          orderId,
          errorParams: operationFailureToErrorParams(result),
        })
      );
    }

    return result;
  }

  private getCancelableOrderIds(marketId?: string): string[] {
    const state = this.store.getState();
    const orders = BonsaiCore.account.openOrders.data(state);

    return orders
      .filter((order) => marketId == null || order.marketId === marketId)
      .map((order) => order.id);
  }

  public async cancelAllOrders({ marketId }: { marketId?: string }) {
    const maybeErr = this.maybeNoLocalWalletError('cancelOrder');
    if (maybeErr) {
      return maybeErr;
    }

    // Get all order IDs that can be canceled
    const orderIds = this.getCancelableOrderIds(marketId);

    if (orderIds.length === 0) {
      return wrapSimpleError('AccountTransactionSupervisor/cancelAllOrders', 'no orders to cancel');
    }

    // Dispatch action to track cancellation request
    this.store.dispatch(cancelAllSubmitted({ marketId, orderIds }));

    // Execute all cancel operations and collect results
    const results = await Promise.all(
      orderIds.map(async (orderId) => {
        const result = await this.orderCancelExecutor.enqueue(() =>
          this.executeCancelOrder(orderId)
        );

        if (isOperationFailure(result)) {
          const order = BonsaiCore.account.allOrders
            .data(this.store.getState())
            .find((o) => o.id === orderId);

          if (order) {
            this.store.dispatch(
              cancelAllOrderFailed({
                order,
                errorParams: operationFailureToErrorParams(result),
              })
            );
          }
        }
        return result;
      })
    );

    // Return success if at least one order was successfully canceled
    const allSuccess = results.every(isOperationSuccess);
    if (allSuccess) {
      return wrapOperationSuccess({
        results,
      });
    }
    return results.find(isOperationFailure)!;
  }

  public tearDown(): void {
    this.unsubscribes.forEach((u) => u?.());
    this.unsubscribes = [];
  }
}

export const createAccountTransactionSupervisor = (
  store: RootStore,
  compositeClientManager: typeof CompositeClientManager
): AccountTransactionSupervisor => {
  return new AccountTransactionSupervisor(store, compositeClientManager);
};
