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

import {
  AnalyticsEvents,
  TradeAdditionalMetadata,
  TradeMetadataSource,
  TransactionMemo,
} from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import {
  MARKET_ORDER_MAX_SLIPPAGE,
  POST_TRANSFER_PLACE_ORDER_DELAY,
  SHORT_TERM_ORDER_DURATION,
  UNCOMMITTED_ORDER_TIMEOUT_MS,
} from '@/constants/trade';

import type { RootStore } from '@/state/_store';
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

import { createMiddleware, createMiddlewareFailureResult, taskBuilder } from './SimpleMiddleware';
import { StateConditionNotifier, Tracker } from './StateConditionNotifier';
import { getSimpleOrderStatus } from './calculators/orders';
import { TradeFormPayload } from './forms/trade/types';
import { PlaceOrderMarketInfo, PlaceOrderPayload } from './forms/triggers/types';
import { CompositeClientManager } from './rest/lib/compositeClientManager';
import { estimateLiveValidatorHeight } from './selectors/apiStatus';

interface TransactionSupervisorShared {
  store: RootStore;
  compositeClientManager: typeof CompositeClientManager;
  stateNotifier: StateConditionNotifier;
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

  private shared: TransactionSupervisorShared;

  constructor(store: RootStore, compositeClientManager: typeof CompositeClientManager) {
    this.store = store;

    this.shared = {
      compositeClientManager,
      store,
      stateNotifier: new StateConditionNotifier(store),
    };
  }

  private wrapOperation<T, Payload, P, Q>(
    nameForLogging: string,
    basePayload: Payload,
    fn: (args: { payload: Payload } & AddClientAndWalletMiddlewareProps) => Promise<T>,
    tracking?: Tracker<P, Q>
  ) {
    return async () => {
      const result = await taskBuilder({ payload: basePayload })
        .with<AddSharedContextMiddlewareProps>(
          addSharedContextMiddleware(nameForLogging, this.shared)
        )
        .with<ValidateLocalWalletMiddlewareProps>(validateLocalWalletMiddleware())
        .with<StateTrackingProps<Q>>(stateTrackingMiddleware(tracking))
        .with<BonsaiLoggingMiddlewareProps>(bonsaiLoggingMiddleware())
        .with<AddClientAndWalletMiddlewareProps>(addClientAndWalletMiddleware(this.store))
        .do(
          chainOperationEngine(async (context) => {
            const { compositeClient, localWallet, payload } = context;
            return fn({
              payload,
              compositeClient,
              localWallet,
            });
          })
        );

      return result;
    };
  }

  private createCancelOrderPayload(orderId: string): CancelOrderPayload | undefined {
    const state = this.store.getState();
    const orders = BonsaiCore.account.allOrders.data(state);
    const order = orders.find((o) => o.id === orderId);
    const fnName = 'AccountTransactionSupervisor/createCancelOrderPayload';

    if (!order) {
      logBonsaiError(fnName, 'Order not found', {
        orderId,
      });
      return undefined;
    }

    if (order.status === OrderStatus.Canceled) {
      logBonsaiInfo(fnName, 'Order already canceled', { orderId });
      return undefined;
    }

    const clobPairId = order.clobPairId;
    const clientId = AttemptNumber(order.clientId);

    if (clientId == null || clobPairId == null) {
      logBonsaiError(fnName, 'Invalid client ID or CLOB pair ID', {
        orderId,
      });
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
        logBonsaiError(fnName, 'Unsupported order flags', {
          orderId,
          orderFlags: order.orderFlags,
        });
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
    const fnName = 'AccountTransactionSupervisor/executeCancelOrder';

    if (cancelPayload == null) {
      return wrapSimpleError(
        fnName,
        'Unable to create cancel payload for order',
        STRING_KEYS.NO_ORDERS_TO_CANCEL
      );
    }

    return this.wrapOperation(
      fnName,
      cancelPayload,
      async ({ compositeClient, localWallet, payload }) => {
        // Create a SubaccountClient using the wallet and subaccount number
        const subaccountClient = SubaccountClient.forLocalWallet(
          localWallet,
          payload.subaccountNumber
        );

        // Initiate the cancellation using cancelRawOrder
        return compositeClient.cancelRawOrder(
          subaccountClient,
          payload.clientId,
          payload.orderFlags,
          payload.clobPairId,
          payload.goodTilBlock === 0 ? undefined : payload.goodTilBlock,
          payload.goodTilBlockTime === 0 ? undefined : payload.goodTilBlockTime
        );
      },
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

  private getCancelableOrders(marketId?: string): SubaccountOrder[] {
    const state = this.store.getState();
    const orders = BonsaiCore.account.openOrders.data(state);

    return orders.filter((order) => marketId == null || order.marketId === marketId);
  }

  private getCloseAllPositionsPayloads(): PlaceOrderPayload[] | undefined {
    const state = this.store.getState();
    const positions = BonsaiCore.account.parentSubaccountPositions.data(state);
    const fnName = 'AccountTransactionSupervisor/getCloseAllPositionsPayloads';

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
        fnName,
        'cannot generate close all positions payload because validatorHeight is null'
      );
      return undefined;
    }

    const markets = BonsaiCore.markets.markets.data(state);
    if (markets == null) {
      logBonsaiError(fnName, 'cannot generate close all positions payload because markets is null');
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
            fnName,
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
      async ({ compositeClient, localWallet, payload }) => {
        const isIsolatedCancel = payload.toSubaccountNumber === 0;

        const tx = await compositeClient.transferToSubaccount(
          SubaccountClient.forLocalWallet(localWallet, payload.fromSubaccountNumber),
          payload.targetAddress,
          payload.toSubaccountNumber,
          MustBigNumber(payload.amount).toFixed(6),
          isIsolatedCancel
            ? TransactionMemo.cancelOrderTransfer
            : TransactionMemo.transferForIsolatedMarginOrder
        );

        return tx;
      },
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
      async ({ compositeClient, localWallet, payload: innerPayload }) => {
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

        const subaccountClientToUse = SubaccountClient.forLocalWallet(
          localWallet,
          subaccountNumberToUse
        );

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
  public async placeOrder(
    payloadArg: PlaceOrderPayload,
    source: TradeMetadataSource
  ): Promise<OperationResult<any>> {
    return (
      taskBuilder({ payload: payloadArg })
        .with<AddSharedContextMiddlewareProps>(
          addSharedContextMiddleware('AccountTransactionSupervisor/placeOrderWrapper', this.shared)
        )
        .with<ValidateLocalWalletMiddlewareProps>(validateLocalWalletMiddleware())
        // fully prepare/augment the trade payload
        .with<{
          trackingMetadata: TradeAdditionalMetadata;
          transferMetadata: { sourceSubaccount: number; sourceAddress: string };
          isShortTermOrder: boolean;
        }>(async (context, next) => {
          const currentHeight = estimateLiveValidatorHeight(
            this.store.getState(),
            BLOCK_TIME_BIAS_FOR_SHORT_TERM_ESTIMATION
          );
          if (currentHeight == null) {
            return createMiddlewareFailureResult(
              wrapSimpleError(
                context.fnName,
                'validator height unknown',
                STRING_KEYS.UNKNOWN_VALIDATOR_HEIGHT
              ),
              context
            );
          }

          const sourceSubaccount = getSubaccountId(this.store.getState());
          const sourceAddress = getUserWalletAddress(this.store.getState());
          if (sourceSubaccount == null || sourceAddress == null) {
            return createMiddlewareFailureResult(
              wrapSimpleError(
                context.fnName,
                'unknown parent subaccount number or address',
                STRING_KEYS.SOMETHING_WENT_WRONG
              ),
              context
            );
          }
          const transferMetadata = { sourceSubaccount, sourceAddress };

          const payloadBase = context.payload;
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
          const trackingMetadata: TradeAdditionalMetadata = {
            source,
            volume: payload.size * payload.price,
          };

          return next({
            ...context,
            payload,
            trackingMetadata,
            transferMetadata,
            isShortTermOrder,
          });
        })
        // handle store dispatching
        .with<{}>(async (context, next) => {
          const { payload } = context;
          this.store.dispatch(
            placeOrderSubmitted({
              marketId: payload.marketId,
              clientId: `${payload.clientId}`,
              orderType: payload.type,
              subaccountNumber: payload.subaccountNumber,
            })
          );
          const overallResult = await next(context);
          if (isOperationFailure(overallResult.result)) {
            this.store.dispatch(
              placeOrderFailed({
                clientId: `${payload.clientId}`,
                errorParams: operationFailureToErrorParams(overallResult.result),
              })
            );
          }
          return overallResult;
        })
        // analytics
        .with<{ confirmedEvent: SimpleEvent<{}> }>(async (context, next) => {
          const { payload, trackingMetadata } = context;
          track(AnalyticsEvents.TradePlaceOrder({ ...payload, ...trackingMetadata }));
          const startTime = startTimer();
          const submitTime = createTimer();

          const confirmedEvent = new SimpleEvent<{}>();
          confirmedEvent.addListener(() => {
            track(
              AnalyticsEvents.TradePlaceOrderConfirmed({
                ...payload,
                roundtripMs: startTime.elapsed(),
                sinceSubmissionMs: submitTime.elapsed(),
                ...trackingMetadata,
              })
            );
          });

          const overallResult = await next({ ...context, confirmedEvent });
          submitTime.start();

          if (isOperationFailure(overallResult.result)) {
            track(
              AnalyticsEvents.TradePlaceOrderSubmissionFailed({
                ...payload,
                error: overallResult.result.errorString,
                durationMs: startTime.elapsed(),
                ...trackingMetadata,
              })
            );
          } else if (isOperationSuccess(overallResult.result)) {
            track(
              AnalyticsEvents.TradePlaceOrderSubmissionConfirmed({
                ...payload,
                durationMs: startTime.elapsed(),
                ...trackingMetadata,
              })
            );
          }

          return overallResult;
        })
        .do(async (context) => {
          const { payload, transferMetadata } = context;

          const overallResult = await this.wrapOperation(
            context.fnName,
            payload,
            async ({ payload: innerPayload }) => {
              const subaccountTransferResult = await calc(async () => {
                if (
                  innerPayload.transferToSubaccountAmount != null &&
                  innerPayload.transferToSubaccountAmount > 0
                ) {
                  const res = await this.executeSubaccountTransfer({
                    fromSubaccountNumber: transferMetadata.sourceSubaccount,
                    toSubaccountNumber: innerPayload.subaccountNumber,
                    amount: innerPayload.transferToSubaccountAmount,
                    targetAddress: transferMetadata.sourceAddress,
                  });
                  await sleep(POST_TRANSFER_PLACE_ORDER_DELAY);
                  return res;
                }

                return wrapOperationSuccess({});
              });

              if (isOperationFailure(subaccountTransferResult)) {
                throw new WrappedOperationFailureError(subaccountTransferResult);
              }
              const placeOrderResult = await this.executePlaceOrder(innerPayload);
              if (isOperationFailure(placeOrderResult)) {
                throw new WrappedOperationFailureError(placeOrderResult);
              }
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
                  context.confirmedEvent.trigger({});
                }
              },
            }
          )();

          return overallResult;
        })
    );
  }

  public async closeAllPositions() {
    track(AnalyticsEvents.TradeCloseAllPositionsClick({}));

    return taskBuilder({ payload: {} })
      .with<AddSharedContextMiddlewareProps>(
        addSharedContextMiddleware('AccountTransactionSupervisor/closeAllPositions', this.shared)
      )
      .with<ValidateLocalWalletMiddlewareProps>(validateLocalWalletMiddleware())
      .with<{ closePayloads: PlaceOrderPayload[] }>(async (context, next) => {
        const closePayloads = this.getCloseAllPositionsPayloads();

        if (closePayloads == null) {
          return createMiddlewareFailureResult(
            wrapSimpleError(
              context.fnName,
              'error generating close position payloads',
              STRING_KEYS.SOMETHING_WENT_WRONG
            ),
            context
          );
        }

        if (closePayloads.length === 0) {
          return createMiddlewareFailureResult(
            wrapSimpleError(
              context.fnName,
              'no positions to close',
              STRING_KEYS.NO_POSITIONS_TO_CLOSE
            ),
            context
          );
        }

        return next({ ...context, closePayloads });
      })
      .do(async ({ closePayloads }) => {
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
      });
  }

  public async cancelOrder({
    orderId,
    withNotification = true,
  }: {
    orderId: string;
    withNotification?: boolean;
  }) {
    return (
      taskBuilder({ payload: { orderId, withNotification } })
        .with<AddSharedContextMiddlewareProps>(
          addSharedContextMiddleware('AccountTransactionSupervisor/cancelOrder', this.shared)
        )
        .with<ValidateLocalWalletMiddlewareProps>(validateLocalWalletMiddleware())
        // populate order details
        .with<{ order: SubaccountOrder; uuid: string }>(async (context, next) => {
          const uuid = crypto.randomUUID();
          const order = this.getCancelableOrders().find((o) => o.id === orderId);
          if (order == null) {
            return createMiddlewareFailureResult(
              wrapSimpleError(
                context.fnName,
                'invalid or missing order id',
                STRING_KEYS.NO_ORDERS_TO_CANCEL
              ),
              context
            );
          }
          return next({ ...context, order, uuid });
        })
        // dispatch store updates
        .with<{}>(async (context, next) => {
          if (withNotification) {
            context.shared.store.dispatch(
              cancelOrderSubmitted({
                order: context.order,
                orderId: context.order.id,
                uuid: context.uuid,
              })
            );
          }

          const result = await next(context);

          if (isOperationFailure(result.result) && withNotification) {
            context.shared.store.dispatch(
              cancelOrderFailed({
                uuid: context.uuid,
                errorParams: operationFailureToErrorParams(result.result),
              })
            );
          }

          return result;
        })
        // cancel analytics events
        .with<{ onConfirm: () => undefined }>(async (context, next) => {
          track(AnalyticsEvents.TradeCancelOrder({ orderId }));

          const startTime = startTimer();
          const submitTime = createTimer();

          const result = await next({
            ...context,
            onConfirm: () => {
              track(
                AnalyticsEvents.TradeCancelOrderConfirmed({
                  orderId,
                  roundtripMs: startTime.elapsed(),
                  sinceSubmissionMs: submitTime.elapsed(),
                })
              );
            },
          });
          submitTime.start();

          if (isOperationFailure(result.result)) {
            track(
              AnalyticsEvents.TradeCancelOrderSubmissionFailed({
                orderId,
                error: result.result.errorString,
                durationMs: startTime.elapsed(),
              })
            );
          } else {
            track(
              AnalyticsEvents.TradeCancelOrderSubmissionConfirmed({
                orderId,
                durationMs: startTime.elapsed(),
              })
            );
          }

          return result;
        })
        .do(async (context) => {
          const result = await this.executeCancelOrder(orderId, () => {
            context.onConfirm();
          });
          return result;
        })
    );
  }

  public async cancelAllOrders({ marketId }: { marketId?: string }) {
    track(AnalyticsEvents.TradeCancelAllOrdersClick({ marketId }));

    return taskBuilder({ payload: { marketId } })
      .with<AddSharedContextMiddlewareProps>(
        addSharedContextMiddleware('AccountTransactionSupervisor/cancelAllOrders', this.shared)
      )
      .with<ValidateLocalWalletMiddlewareProps>(validateLocalWalletMiddleware())
      .with<{ ordersWithUuids: Array<{ order: SubaccountOrder; uuid: string }> }>(
        async (context, next) => {
          const orders = this.getCancelableOrders(marketId);

          if (orders.length === 0) {
            return createMiddlewareFailureResult(
              wrapSimpleError(
                context.fnName,
                'no orders to cancel',
                STRING_KEYS.NO_ORDERS_TO_CANCEL
              ),
              context
            );
          }

          const ordersWithUuids = orders.map((order) => ({
            order,
            uuid: crypto.randomUUID(),
          }));

          return next({ ...context, ordersWithUuids });
        }
      )
      .do(async ({ ordersWithUuids }) => {
        // Dispatch action to track cancellation request
        this.store.dispatch(
          cancelAllSubmitted({
            marketId,
            cancels: ordersWithUuids.map((o) => ({
              order: o.order,
              orderId: o.order.id,
              uuid: o.uuid,
            })),
          })
        );

        // Execute all cancel operations and collect results
        const results = await Promise.all(
          ordersWithUuids.map(async (orderAndId) => {
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
      });
  }

  public async placeCompoundOrder(order: TradeFormPayload, source: TradeMetadataSource) {
    if (order.orderPayload != null) {
      const res = await this.placeOrder(order.orderPayload, source);
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
            const res = await this.placeOrder(operationPayload.placePayload, source);
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
    this.shared.stateNotifier.tearDown();
  }
}

const createAccountTransactionSupervisor = (
  store: RootStore,
  compositeClientManager: typeof CompositeClientManager
): AccountTransactionSupervisor => {
  return new AccountTransactionSupervisor(store, compositeClientManager);
};

export const accountTransactionManager = createAccountTransactionSupervisor(
  reduxStore,
  CompositeClientManager
);

function chainOperationEngine<Payload extends AddLoggingNameMiddlewareProps, T>(
  fn: (payload: Payload) => Promise<T>
): (payload: Payload) => Promise<OperationResult<ToPrimitives<T>>> {
  return async (context: Payload) => {
    try {
      const tx = await fn(context);
      const parsedTx = parseToPrimitives(tx);
      return wrapOperationSuccess(parsedTx);
    } catch (error) {
      if (isWrappedOperationFailureError(error)) {
        return error.getFailure();
      }
      const errorString = stringifyTransactionError(error);
      const parsed = parseTransactionError(context.fnName, errorString);
      return wrapOperationFailure(errorString, parsed);
    }
  };
}

type AddLoggingNameMiddlewareProps = { fnName: string };
type AddSharedContextMiddlewareProps = {
  shared: TransactionSupervisorShared;
} & AddLoggingNameMiddlewareProps;
function addSharedContextMiddleware(fnName: string, shared: TransactionSupervisorShared) {
  return createMiddleware<AddSharedContextMiddlewareProps>((context, next) => {
    return next({ ...context, shared, fnName });
  });
}

type ValidateLocalWalletMiddlewareProps = {};
function validateLocalWalletMiddleware() {
  return createMiddleware<{}, AddSharedContextMiddlewareProps>(async (context, next) => {
    const state = context.shared.store.getState();
    const localWalletNonce = getLocalWalletNonce(state);

    if (localWalletNonce == null) {
      const errorMsg = 'No valid local wallet available';
      const errSource = context.fnName;
      logBonsaiError(errSource, errorMsg);
      return createMiddlewareFailureResult(
        wrapSimpleError(errSource, errorMsg, STRING_KEYS.NO_LOCAL_WALLET),
        context
      );
    }

    return next(context);
  });
}

type AddClientAndWalletMiddlewareProps = {
  compositeClient: CompositeClient;
  localWallet: LocalWallet;
};
function addClientAndWalletMiddleware(store: RootStore) {
  const nonceBefore = getLocalWalletNonce(store.getState());
  const networkBefore = getSelectedNetwork(store.getState());

  return createMiddleware<AddClientAndWalletMiddlewareProps, AddSharedContextMiddlewareProps>(
    async (context, next) => {
      const network = getSelectedNetwork(context.shared.store.getState());
      const localWalletNonce = getLocalWalletNonce(context.shared.store.getState());

      const clientConfig = {
        network,
        dispatch: context.shared.store.dispatch,
      };
      const clientWrapper = context.shared.compositeClientManager.use(clientConfig);

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

        // Execute the next middleware with the client wallet pair
        return await next({ ...context, compositeClient, localWallet });
      } catch (error) {
        const errorString = stringifyTransactionError(error);
        const parsed = parseTransactionError(context.fnName, errorString);
        return createMiddlewareFailureResult(wrapOperationFailure(errorString, parsed), context);
      } finally {
        // Always mark the client as done to prevent memory leaks
        context.shared.compositeClientManager.markDone(clientConfig);
      }
    }
  );
}

type BonsaiLoggingMiddlewareProps = {};
function bonsaiLoggingMiddleware() {
  return createMiddleware<
    BonsaiLoggingMiddlewareProps,
    AddSharedContextMiddlewareProps & StateTrackingProps<any> & { payload: any }
  >(async (context, next) => {
    const startTime = startTimer();
    const submittedTime = createTimer();

    const { payload } = context;

    logBonsaiInfo(context.fnName, 'Attempting operation', { payload });

    const result = await next(context);

    context.stateTracker.addListener(
      () => {
        submittedTime.start();
      },
      (resultOrNull) => {
        if (!isOperationSuccess(result.result)) {
          return;
        }
        if (resultOrNull != null) {
          logBonsaiInfo(context.fnName, 'Successfully confirmed operation', {
            payload,
            parsedTx: result.result.payload,
            result: purgeBigNumbers(resultOrNull),
            totalTimeToConfirm: startTime.elapsed(),
            timeToConfirmAfterSubmitted: submittedTime.elapsed(),
            source: context.fnName,
          });
        } else {
          logBonsaiError(context.fnName, 'Failed to confirm operation', {
            payload,
            parsedTx: result.result.payload,
            result: resultOrNull,
            source: context.fnName,
          });
        }
      }
    );

    if (isOperationSuccess(result.result)) {
      logBonsaiInfo(context.fnName, 'Successful operation', {
        payload,
        parsedTx: result.result.payload,
        timeToSubmit: startTime.elapsed(),
        source: context.fnName,
      });
    } else {
      logBonsaiError(context.fnName, 'Failed operation', {
        payload,
        parsed: result.result.displayInfo,
        errorString: result.result.errorString,
        source: context.fnName,
        timeToSubmit: startTime.elapsed(),
      });
    }

    return result;
  });
}

type StateTrackingProps<T> = {
  stateTracker: {
    addListener: (onStart: () => void, onComplete: (result: T | null) => void) => void;
  };
};

function stateTrackingMiddleware<P, Q>(tracking?: Tracker<P, Q>) {
  return createMiddleware<StateTrackingProps<Q>, AddSharedContextMiddlewareProps>(
    async (context, next) => {
      let hasStarted = false;
      let hasFinished = false;
      let finishedResult: Q | null | undefined;

      const listeners: Array<{
        onStart: () => void;
        onComplete: (result: Q | null) => void;
      }> = [];

      const stateTracker = {
        addListener: (onStart: () => void, onComplete: (result: Q | null) => void) => {
          listeners.push({ onStart, onComplete });
          if (hasStarted) {
            onStart();
          }
          if (hasFinished) {
            // eslint-disable-next-line no-console
            console.warn('Warning: a state tracker added a listener after operation was complete');
            onComplete(finishedResult ?? null);
          }
        },
      };

      const result = await next({ ...context, stateTracker });

      // Only start tracking if the operation succeeded and tracking is provided
      if (isOperationSuccess(result.result) && tracking != null) {
        hasStarted = true;

        // Notify all listeners that tracking is starting
        listeners.forEach((listener) => {
          try {
            listener.onStart();
          } catch (e) {
            // ignore listener errors
          }
        });

        context.shared.stateNotifier.notifyWhenTrue(
          tracking.selector,
          tracking.validator,
          (resultOrNull) => {
            hasFinished = true;
            finishedResult = resultOrNull;

            listeners.forEach((listener) => {
              try {
                listener.onComplete(resultOrNull);
              } catch (e) {
                // ignore listener errors
              }
            });

            // Call the original onTrigger if it exists
            tracking.onTrigger?.(resultOrNull != null);
          }
        );
      }

      return result;
    }
  );
}

class SimpleEvent<T> {
  private listeners: Array<(data: T) => void> = [];

  addListener(listener: (data: T) => void): void {
    this.listeners.push(listener);
  }

  trigger(data: T): void {
    this.listeners.forEach((listener) => listener(data));
  }
}
