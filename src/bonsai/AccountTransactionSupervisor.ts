/* eslint-disable max-classes-per-file */
import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import {
  isOperationFailure,
  isOperationSuccess,
  isWrappedOperationFailureError,
  OperationResult,
  wrapOperationFailure,
  wrapOperationSuccess,
  WrappedOperationFailureError,
} from '@/bonsai/lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import { OrderStatus, SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { IndexedTx } from '@cosmjs/stargate';
import {
  CompositeClient,
  LocalWallet,
  OrderExecution,
  OrderFlags,
  OrderSide,
  OrderTimeInForce,
  OrderType,
  SubaccountClient,
} from '@dydxprotocol/v4-client-js';

import { AnalyticsEvents, TransactionMemo } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';
import {
  MARKET_ORDER_MAX_SLIPPAGE,
  POST_TRANSFER_PLACE_ORDER_DELAY,
  SHORT_TERM_ORDER_DURATION,
  UNCOMMITTED_ORDER_TIMEOUT_MS,
} from '@/constants/trade';

import type { RootState, RootStore } from '@/state/_store';
import { store as reduxStore } from '@/state/_store';
import { getSubaccountId, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import {
  cancelAllSubmitted,
  cancelOrderFailed,
  cancelOrderSubmitted,
  closeAllPositionsSubmitted,
  placeOrderFailed,
  placeOrderSubmitted,
  placeOrderTimeout,
} from '@/state/localOrders';
import { getLocalWalletNonce } from '@/state/walletSelectors';

import { track } from '@/lib/analytics/analytics';
import { calc } from '@/lib/do';
import { operationFailureToErrorParams, wrapSimpleError } from '@/lib/errorHelpers';
import { StatefulOrderError, stringifyTransactionError } from '@/lib/errors';
import { localWalletManager } from '@/lib/hdKeyManager';
import { AttemptBigNumber, AttemptNumber, MAX_INT_ROUGHLY, MustBigNumber } from '@/lib/numbers';
import { parseToPrimitives, ToPrimitives } from '@/lib/parseToPrimitives';
import { ConvertBigNumberToNumber, purgeBigNumbers } from '@/lib/purgeBigNumber';
import { createTimer, startTimer } from '@/lib/simpleTimer';
import { sleep } from '@/lib/timeUtils';
import { isPresent } from '@/lib/typeUtils';

import { getSimpleOrderStatus } from './calculators/orders';
import { TradeFormPayload } from './forms/trade/types';
import { PlaceOrderMarketInfo, PlaceOrderPayload } from './forms/triggers/types';
import { CompositeClientManager } from './rest/lib/compositeClientManager';
import { estimateLiveValidatorHeight } from './selectors/apiStatus';

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

  originalOrder: ConvertBigNumberToNumber<SubaccountOrder> | undefined;
}

const BLOCK_TIME_BIAS_FOR_SHORT_TERM_ESTIMATION = 0.9;
export const SHORT_TERM_ORDER_DURATION_SAFETY_MARGIN = 5;

export class AccountTransactionSupervisor {
  private store: RootStore;

  private compositeClientManager: typeof CompositeClientManager;

  private stateNotifier: StateConditionNotifier;

  constructor(store: RootStore, compositeClientManager: typeof CompositeClientManager) {
    this.store = store;
    this.compositeClientManager = compositeClientManager;

    this.stateNotifier = new StateConditionNotifier(store);
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
        const compositeClient = await clientWrapper.compositeClient.deferred.promise;

        // Execute the function with the client wallet pair
        return await fn({ compositeClient, localWallet }, ...args);
      } finally {
        // Always mark the client as done to prevent memory leaks
        this.compositeClientManager.markDone(clientConfig);
      }
    };
  }

  private wrapOperation<T, Payload, P, Q>(
    nameForLogging: string,
    payload: Payload,
    fn: (payload: Payload) => Promise<T>,
    tracking?: Tracker<P, Q>
  ): () => Promise<OperationResult<ToPrimitives<T>>> {
    return async () => {
      const startTime = startTimer();
      try {
        logBonsaiInfo(nameForLogging, 'Attempting operation', { payload });

        const tx = await fn(payload);

        const parsedTx = parseToPrimitives(tx);

        const submittedTime = startTimer();
        logBonsaiInfo(nameForLogging, 'Successful operation', {
          payload,
          parsedTx,
          timeToSubmit: startTime.elapsed(),
          source: nameForLogging,
        });

        if (tracking != null) {
          this.stateNotifier.notifyWhenTrue(
            tracking.selector,
            tracking.validator,
            (resultOrNull) => {
              try {
                tracking.onTrigger?.(resultOrNull != null);
              } catch (e) {
                // do nothing
              }
              if (resultOrNull != null) {
                logBonsaiInfo(nameForLogging, 'Successfully confirmed operation', {
                  payload,
                  parsedTx,
                  result: purgeBigNumbers(resultOrNull),
                  totalTimeToConfirm: startTime.elapsed(),
                  timeToConfirmAfterSubmitted: submittedTime.elapsed(),
                  source: nameForLogging,
                });
              } else {
                logBonsaiError(nameForLogging, 'Failed to confirm operation', {
                  payload,
                  parsedTx,
                  result: resultOrNull,
                  source: nameForLogging,
                });
              }
            }
          );
        }

        return wrapOperationSuccess(parsedTx);
      } catch (error) {
        if (isWrappedOperationFailureError(error)) {
          return error.getFailure();
        }
        const errorString = stringifyTransactionError(error);
        const parsed = parseTransactionError(nameForLogging, errorString);
        logBonsaiError(nameForLogging, 'Failed operation', {
          payload,
          parsed,
          errorString,
          error,
          source: nameForLogging,
          timeToSubmit: startTime.elapsed(),
        });
        return wrapOperationFailure(errorString, parsed);
      }
    };
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

      originalOrder: purgeBigNumbers(order),
    };
  }

  private async executeCancelOrder(orderId: string, onConfirmed?: () => void) {
    const cancelPayload = this.createCancelOrderPayload(orderId);

    if (cancelPayload == null) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/executeCancelOrder',
        'Unable to create cancel payload for order',
        STRING_KEYS.NO_ORDERS_TO_CANCEL
      );
    }

    return this.wrapOperation(
      'AccountTransactionSupervisor/executeCancelOrder',
      cancelPayload,
      this.doClientAndWalletOperation(async ({ compositeClient, localWallet }, payload) => {
        // Create a SubaccountClient using the wallet and subaccount number
        const subaccountClient = new SubaccountClient(localWallet, payload.subaccountNumber);

        // Initiate the cancellation using cancelRawOrder
        return compositeClient.cancelRawOrder(
          subaccountClient,
          payload.clientId,
          payload.orderFlags,
          payload.clobPairId,
          payload.goodTilBlock === 0 ? undefined : payload.goodTilBlock,
          payload.goodTilBlockTime === 0 ? undefined : payload.goodTilBlockTime
        );
      }),
      {
        selector: BonsaiCore.account.allOrders.data,
        validator: (orders) => {
          const order = orders.find((o) => o.id === orderId);
          if (
            order?.status != null &&
            getSimpleOrderStatus(order.status) === OrderStatus.Canceled
          ) {
            return order;
          }
          return undefined;
        },
        onTrigger: (success) => {
          if (success) {
            onConfirmed?.();
          }
        },
      }
    )();
  }

  private maybeNoLocalWalletError(fnName: string) {
    if (!this.hasValidLocalWallet()) {
      const errorMsg = 'No valid local wallet available';
      const errSource = `AccountTransactionSupervisor/${fnName}`;
      logBonsaiError(errSource, errorMsg);
      return wrapSimpleError(errSource, errorMsg, STRING_KEYS.NO_LOCAL_WALLET);
    }
    return undefined;
  }

  private getCancelableOrders(marketId?: string): SubaccountOrder[] {
    const state = this.store.getState();
    const orders = BonsaiCore.account.openOrders.data(state);

    return orders.filter((order) => marketId == null || order.marketId === marketId);
  }

  private getCloseAllPositionsPayloads(): PlaceOrderPayload[] | undefined {
    const state = this.store.getState();
    const positions = BonsaiCore.account.parentSubaccountPositions.data(state);

    if (positions == null || positions.length === 0) {
      // technically could be fine, just no-op
      return [];
    }

    // Get current blockchain height for goodTilBlock
    const currentHeight = estimateLiveValidatorHeight(
      state,
      BLOCK_TIME_BIAS_FOR_SHORT_TERM_ESTIMATION
    );
    if (currentHeight == null) {
      logBonsaiError(
        'AccountTransactionSupervisor/getCloseAllPositionsPayloads',
        'cannot generate close all positions payload because validatorHeight is null'
      );
      return undefined;
    }

    const markets = BonsaiCore.markets.markets.data(state);
    if (markets == null) {
      logBonsaiError(
        'AccountTransactionSupervisor/getCloseAllPositionsPayloads',
        'cannot generate close all positions payload because markets is null'
      );
      return undefined;
    }

    return positions
      .filter((position) => position.unsignedSize.gt(0))
      .map((position): PlaceOrderPayload | undefined => {
        const clientId = Math.floor(Math.random() * MAX_INT_ROUGHLY);

        // Get market information to calculate price with slippage
        const marketId = position.market;
        const market = markets[marketId];
        const oraclePrice = AttemptBigNumber(market?.oraclePrice);

        if (!market || oraclePrice == null || oraclePrice.isZero()) {
          logBonsaiError(
            'AccountTransactionSupervisor/getCloseAllPositionsPayloads',
            'cannot generate close position payload because market is null or oracle is bad',
            { market }
          );
          return undefined;
        }

        // Determine order side (opposite of position side)
        const positionSize = position.signedSize;
        const side = positionSize.isGreaterThan(0) ? OrderSide.SELL : OrderSide.BUY;

        // Calculate price with slippage
        const price =
          side === OrderSide.BUY
            ? oraclePrice.times(1 + MARKET_ORDER_MAX_SLIPPAGE).toNumber()
            : oraclePrice.times(1 - MARKET_ORDER_MAX_SLIPPAGE).toNumber();

        const clobPairId = AttemptNumber(market.clobPairId);
        if (clobPairId == null) {
          return undefined;
        }
        const marketInfo: PlaceOrderMarketInfo = {
          clobPairId,
          atomicResolution: market.atomicResolution,
          stepBaseQuantums: market.stepBaseQuantums,
          quantumConversionExponent: market.quantumConversionExponent,
          subticksPerTick: market.subticksPerTick,
        };

        // Calculate goodTilBlock if we have current height
        const goodTilBlock =
          currentHeight + SHORT_TERM_ORDER_DURATION - SHORT_TERM_ORDER_DURATION_SAFETY_MARGIN;

        // Return the order payload
        return {
          subaccountNumber: position.subaccountNumber,
          marketId,
          clobPairId,
          clientId,
          type: OrderType.MARKET,
          side,
          price,
          size: positionSize.abs().toNumber(),
          reduceOnly: true,
          postOnly: false,
          timeInForce: OrderTimeInForce.IOC,
          execution: OrderExecution.DEFAULT,
          goodTilBlock,
          goodTilTimeInSeconds: undefined,
          memo: TransactionMemo.placeOrder,
          triggerPrice: undefined,
          transferToSubaccountAmount: undefined,
          marketInfo,
          currentHeight,
        };
      })
      .filter(isPresent);
  }

  private async executeSubaccountTransfer(outerPayload: {
    amount: number;
    fromSubaccountNumber: number;
    toSubaccountNumber: number;
    targetAddress: string;
  }) {
    const selectSubaccountBalance = createAppSelector(
      BonsaiCore.account.childSubaccountSummaries.data,
      (summaries) => {
        const summary = summaries?.[outerPayload.toSubaccountNumber];
        return summary?.equity.toNumber() ?? 0;
      }
    );
    const startState = this.store.getState();
    const startBalance = selectSubaccountBalance(startState);

    const result = await this.wrapOperation(
      'AccountTransactionSupervisor/executeSubaccountTransfer',
      outerPayload,
      this.doClientAndWalletOperation(async ({ compositeClient, localWallet }, payload) => {
        const isIsolatedCancel = payload.toSubaccountNumber === 0;

        const tx = await compositeClient.transferToSubaccount(
          new SubaccountClient(localWallet, payload.fromSubaccountNumber),
          payload.targetAddress,
          payload.toSubaccountNumber,
          MustBigNumber(payload.amount).toFixed(6),
          isIsolatedCancel
            ? TransactionMemo.cancelOrderTransfer
            : TransactionMemo.transferForIsolatedMarginOrder
        );

        return tx;
      }),
      {
        selector: selectSubaccountBalance,
        validator: (balance) => {
          if (balance >= startBalance + outerPayload.amount * 0.9) {
            return { newBalance: balance };
          }
          return undefined;
        },
      }
    )();
    return result;
  }

  private async executePlaceOrder(payload: PlaceOrderPayload): Promise<OperationResult<any>> {
    const placeOrderResult = await this.wrapOperation(
      'AccountTransactionSupervisor/placeOrder',
      payload,
      this.doClientAndWalletOperation(async ({ compositeClient, localWallet }, innerPayload) => {
        const {
          subaccountNumber: subaccountNumberToUse,
          marketId,
          type,
          side,
          price,
          size,
          clientId,
          timeInForce,
          goodTilTimeInSeconds,
          goodTilBlock,
          execution,
          postOnly,
          reduceOnly,
          triggerPrice,
          marketInfo,
          currentHeight,
          memo,
        } = innerPayload;

        // Set timeout for order to be considered failed if not committed
        setTimeout(() => {
          this.store.dispatch(placeOrderTimeout(clientId.toString()));
        }, UNCOMMITTED_ORDER_TIMEOUT_MS);

        const subaccountClientToUse = new SubaccountClient(localWallet, subaccountNumberToUse);

        // Place order
        const tx = await compositeClient.placeOrder(
          subaccountClientToUse,
          marketId,
          type,
          side,
          price,
          size,
          clientId,
          timeInForce,
          goodTilTimeInSeconds ?? 0,
          execution,
          postOnly ?? undefined,
          reduceOnly ?? undefined,
          triggerPrice ?? undefined,
          marketInfo ?? undefined,
          currentHeight ?? undefined,
          goodTilBlock ?? undefined,
          memo
        );

        if ((tx as IndexedTx | undefined)?.code !== 0) {
          throw new StatefulOrderError('Stateful order has failed to commit.', tx);
        }

        return tx;
      }),
      {
        selector: BonsaiCore.account.allOrders.data,
        validator: (orders) => {
          const order = orders.find((o) => o.clientId === `${payload.clientId}`);
          if (order != null) {
            return order;
          }
          return undefined;
        },
      }
    )();

    if (isOperationFailure(placeOrderResult)) {
      this.store.dispatch(
        placeOrderFailed({
          clientId: `${payload.clientId}`,
          errorParams: operationFailureToErrorParams(placeOrderResult),
        })
      );
    }

    return placeOrderResult;
  }

  // does subaccount transfer and place order and manages local order state
  public async placeOrder(payloadBase: PlaceOrderPayload): Promise<OperationResult<any>> {
    const maybeErr = this.maybeNoLocalWalletError('placeOrder');
    if (maybeErr) {
      return maybeErr;
    }

    const sourceSubaccount = getSubaccountId(this.store.getState());
    const sourceAddress = getUserWalletAddress(this.store.getState());
    if (sourceSubaccount == null || sourceAddress == null) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/placeOrder',
        'unknown parent subaccount number or address',
        STRING_KEYS.SOMETHING_WENT_WRONG
      );
    }

    const currentHeight = estimateLiveValidatorHeight(
      this.store.getState(),
      BLOCK_TIME_BIAS_FOR_SHORT_TERM_ESTIMATION
    );
    if (currentHeight == null) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/placeOrder',
        'validator height unknown',
        STRING_KEYS.UNKNOWN_VALIDATOR_HEIGHT
      );
    }
    const isShortTermOrder = calc(() => {
      if (payloadBase.type === OrderType.MARKET) {
        return true;
      }
      if (payloadBase.type === OrderType.LIMIT) {
        if (payloadBase.timeInForce === OrderTimeInForce.GTT) {
          return false;
        }
        return true;
      }
      return false;
    });
    const payload: PlaceOrderPayload = {
      ...payloadBase,
      currentHeight,
      goodTilBlock: isShortTermOrder
        ? currentHeight + SHORT_TERM_ORDER_DURATION - SHORT_TERM_ORDER_DURATION_SAFETY_MARGIN
        : undefined,
    };

    this.store.dispatch(
      placeOrderSubmitted({
        marketId: payload.marketId,
        clientId: `${payload.clientId}`,
        orderType: payload.type,
        subaccountNumber: payload.subaccountNumber,
      })
    );

    track(AnalyticsEvents.TradePlaceOrder({ ...payload }));
    const startTime = startTimer();
    const submitTime = createTimer();

    const overallResult = await this.wrapOperation(
      'AccountTransactionSupervisor/placeOrderWrapper',
      payload,
      async (innerPayload) => {
        const subaccountTransferResult = await calc(async () => {
          if (
            innerPayload.transferToSubaccountAmount != null &&
            innerPayload.transferToSubaccountAmount > 0
          ) {
            const res = await this.executeSubaccountTransfer({
              fromSubaccountNumber: sourceSubaccount,
              toSubaccountNumber: innerPayload.subaccountNumber,
              amount: innerPayload.transferToSubaccountAmount,
              targetAddress: sourceAddress,
            });
            await sleep(POST_TRANSFER_PLACE_ORDER_DELAY);
            return res;
          }

          return wrapOperationSuccess({});
        });

        if (isOperationFailure(subaccountTransferResult)) {
          throw new WrappedOperationFailureError(subaccountTransferResult);
        }
        const placeOrderResult = await this.executePlaceOrder(payload);
        if (isOperationFailure(placeOrderResult)) {
          throw new WrappedOperationFailureError(placeOrderResult);
        }
        submitTime.start();
        return placeOrderResult.payload;
      },
      {
        selector: BonsaiCore.account.allOrders.data,
        validator: (orders) => {
          const order = orders.find((o) => o.clientId === `${payload.clientId}`);
          if (order != null) {
            return order;
          }
          return undefined;
        },
        onTrigger: (success) => {
          if (success) {
            track(
              AnalyticsEvents.TradePlaceOrderConfirmed({
                ...payload,
                roundtripMs: startTime.elapsed(),
                sinceSubmissionMs: submitTime.elapsed(),
              })
            );
          }
        },
      }
    )();

    if (isOperationFailure(overallResult)) {
      track(
        AnalyticsEvents.TradePlaceOrderSubmissionFailed({
          ...payload,
          error: overallResult.errorString,
          durationMs: startTime.elapsed(),
        })
      );
      this.store.dispatch(
        placeOrderFailed({
          clientId: `${payload.clientId}`,
          errorParams: operationFailureToErrorParams(overallResult),
        })
      );
    } else if (isOperationSuccess(overallResult)) {
      track(
        AnalyticsEvents.TradePlaceOrderSubmissionConfirmed({
          ...payload,
          durationMs: startTime.elapsed(),
        })
      );
    }
    return overallResult;
  }

  public async closeAllPositions() {
    track(AnalyticsEvents.TradeCloseAllPositionsClick({}));

    const maybeErr = this.maybeNoLocalWalletError('closeAllPositions');
    if (maybeErr) {
      return maybeErr;
    }

    const closePayloads = this.getCloseAllPositionsPayloads();

    if (closePayloads == null) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/closeAllPositions',
        'error generating close position payloads',
        STRING_KEYS.SOMETHING_WENT_WRONG
      );
    }

    if (closePayloads.length === 0) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/closeAllPositions',
        'no positions to close',
        STRING_KEYS.NO_POSITIONS_TO_CLOSE
      );
    }

    this.store.dispatch(
      closeAllPositionsSubmitted(
        closePayloads.map((payload) => ({
          marketId: payload.marketId,
          clientId: `${payload.clientId}`,
          orderType: payload.type,
          subaccountNumber: payload.subaccountNumber,
        }))
      )
    );

    const results = await Promise.all(closePayloads.map((p) => this.executePlaceOrder(p)));

    if (results.every(isOperationSuccess)) {
      return wrapOperationSuccess({
        results,
      });
    }

    return results.find(isOperationFailure)!;
  }

  public async cancelOrder({
    orderId,
    withNotification = true,
  }: {
    orderId: string;
    withNotification?: boolean;
  }) {
    const maybeErr = this.maybeNoLocalWalletError('cancelOrder');
    if (maybeErr) {
      return maybeErr;
    }

    // Dispatch action to track cancellation request
    const uuid = crypto.randomUUID();
    const order = this.getCancelableOrders().find((o) => o.id === orderId);
    if (order == null) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/cancelOrder',
        'invalid or missing order id',
        STRING_KEYS.NO_ORDERS_TO_CANCEL
      );
    }

    if (withNotification) {
      this.store.dispatch(cancelOrderSubmitted({ order, orderId: order.id, uuid }));
    }

    track(AnalyticsEvents.TradeCancelOrder({ orderId }));

    const startTime = startTimer();
    const submitTime = createTimer();

    // Queue the cancellation to avoid race conditions
    const result = await this.executeCancelOrder(orderId, () => {
      track(
        AnalyticsEvents.TradeCancelOrderConfirmed({
          orderId,
          roundtripMs: startTime.elapsed(),
          sinceSubmissionMs: submitTime.elapsed(),
        })
      );
    });

    submitTime.start();

    if (isOperationFailure(result)) {
      track(
        AnalyticsEvents.TradeCancelOrderSubmissionFailed({
          orderId,
          error: result.errorString,
          durationMs: startTime.elapsed(),
        })
      );

      if (withNotification) {
        this.store.dispatch(
          cancelOrderFailed({
            uuid,
            errorParams: operationFailureToErrorParams(result),
          })
        );
      }
    } else {
      track(
        AnalyticsEvents.TradeCancelOrderSubmissionConfirmed({
          orderId,
          durationMs: startTime.elapsed(),
        })
      );
    }

    return result;
  }

  public async cancelAllOrders({ marketId }: { marketId?: string }) {
    track(AnalyticsEvents.TradeCancelAllOrdersClick({ marketId }));
    const maybeErr = this.maybeNoLocalWalletError('cancelAllOrders');
    if (maybeErr) {
      return maybeErr;
    }

    // Get all order IDs that can be canceled
    const orders = this.getCancelableOrders(marketId);

    if (orders.length === 0) {
      return wrapSimpleError(
        'AccountTransactionSupervisor/cancelAllOrders',
        'no orders to cancel',
        STRING_KEYS.NO_ORDERS_TO_CANCEL
      );
    }

    const orderdsWithUuids = orders.map((order) => ({
      order,
      uuid: crypto.randomUUID(),
    }));

    // Dispatch action to track cancellation request
    this.store.dispatch(
      cancelAllSubmitted({
        marketId,
        cancels: orderdsWithUuids.map((o) => ({
          order: o.order,
          orderId: o.order.id,
          uuid: o.uuid,
        })),
      })
    );

    // Execute all cancel operations and collect results
    const results = await Promise.all(
      orderdsWithUuids.map(async (orderAndId) => {
        const { order, uuid } = orderAndId;
        const result = await this.executeCancelOrder(order.id);

        if (isOperationFailure(result)) {
          this.store.dispatch(
            cancelOrderFailed({
              uuid,
              errorParams: operationFailureToErrorParams(result),
            })
          );
        }
        return result;
      })
    );

    const allSuccess = results.every(isOperationSuccess);
    if (allSuccess) {
      return wrapOperationSuccess({
        results,
      });
    }
    return results.find(isOperationFailure)!;
  }

  public async placeCompoundOrder(order: TradeFormPayload) {
    if (order.orderPayload != null) {
      const res = await this.placeOrder(order.orderPayload);
      if (isOperationFailure(res)) {
        return res;
      }
    }
    if (order.triggersPayloads != null && order.triggersPayloads.length > 0) {
      const operations = await Promise.all(
        order.triggersPayloads.map(async (operationPayload) => {
          if (operationPayload.cancelPayload?.orderId) {
            const res = await this.cancelOrder({
              orderId: operationPayload.cancelPayload.orderId,
            });
            if (isOperationFailure(res)) {
              return res;
            }
          }
          if (operationPayload.placePayload != null) {
            const res = await this.placeOrder(operationPayload.placePayload);
            if (isOperationFailure(res)) {
              return res;
            }
          }
          return wrapOperationSuccess(true);
        })
      );
      const failure = operations.find(isOperationFailure);
      if (failure != null) {
        return failure;
      }
    }
    return wrapOperationSuccess(true);
  }

  public tearDown(): void {
    this.stateNotifier.tearDown();
  }
}

const createAccountTransactionSupervisor = (
  store: RootStore,
  compositeClientManager: typeof CompositeClientManager
): AccountTransactionSupervisor => {
  return new AccountTransactionSupervisor(store, compositeClientManager);
};

type SelectorFn<Selected> = (state: RootState) => Selected;
type ValidationFn<Selected, Result> = (selected: Selected) => Result | null | undefined;
type NotificationCallback<Result> = (result: Result | null) => void;

interface Tracker<Selected, Result> {
  selector: SelectorFn<Selected>;
  validator: ValidationFn<NoInfer<Selected>, Result>;
  onTrigger?: (success: boolean) => void;
}

interface TrackedCondition<Selected, Result> {
  selector: SelectorFn<Selected>;
  validator: ValidationFn<NoInfer<Selected>, Result>;
  callback: NotificationCallback<NoInfer<Result>>;
  lastValue: Selected | null;
  timeoutId: NodeJS.Timeout | undefined;
}

class StateConditionNotifier {
  private store: RootStore;

  private trackedConditions: Array<TrackedCondition<any, any>> = [];

  private unsubscribeStore: (() => void) | null = null;

  private currentDydxAddress: string | undefined;

  constructor(store: RootStore) {
    this.store = store;
    this.currentDydxAddress = getUserWalletAddress(store.getState());
    this.setupStoreSubscription();
  }

  private setupStoreSubscription(): void {
    this.unsubscribeStore = this.store.subscribe(() => {
      const state = this.store.getState();

      // if address changes, clear all listeners
      const dydxAddress = getUserWalletAddress(state);
      if (dydxAddress !== this.currentDydxAddress) {
        this.currentDydxAddress = dydxAddress;
        this.clearAllConditions();
      }

      this.trackedConditions.forEach((condition) => {
        const currentValue = condition.selector(state);

        if (condition.lastValue === currentValue) {
          return;
        }

        condition.lastValue = currentValue;

        const validationResult = condition.validator(currentValue);
        if (validationResult != null) {
          clearTimeout(condition.timeoutId);
          this.trackedConditions = this.trackedConditions.filter((t) => t !== condition);
          condition.callback(validationResult);
        }
      });
    });
  }

  // if user address changes, callback is never called
  public notifyWhenTrue<Selected, Result>(
    selector: SelectorFn<Selected>,
    validator: ValidationFn<NoInfer<Selected>, Result>,
    callback: NotificationCallback<NoInfer<Result>>,
    timeoutMs: number = timeUnits.second * 30
  ): () => void {
    const state = this.store.getState();
    const initialValue = selector(state);

    // Check if already true
    const validationResult = validator(initialValue);
    if (validationResult != null) {
      callback(validationResult);
      return () => null;
    }

    const condition: TrackedCondition<any, any> = {
      selector,
      validator,
      callback,
      lastValue: initialValue,
      timeoutId: undefined,
    };
    // Set up timeout
    condition.timeoutId = setTimeout(() => {
      this.trackedConditions = this.trackedConditions.filter((t) => t !== condition);
      callback(null);
    }, timeoutMs);

    this.trackedConditions.push(condition);
    return () => {
      clearTimeout(condition.timeoutId);
      this.trackedConditions = this.trackedConditions.filter((t) => t !== condition);
    };
  }

  private clearAllConditions(): void {
    // Clear all timeouts
    this.trackedConditions.forEach((condition) => {
      if (condition.timeoutId) {
        clearTimeout(condition.timeoutId);
      }
    });

    // Clear the map
    this.trackedConditions = [];
  }

  public tearDown(): void {
    this.clearAllConditions();

    // Unsubscribe from store
    this.unsubscribeStore?.();
    this.unsubscribeStore = null;
  }
}

export const accountTransactionManager = createAccountTransactionSupervisor(
  reduxStore,
  CompositeClientManager
);
