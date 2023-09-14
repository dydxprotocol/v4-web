import Abacus, { type Nullable } from '@dydxprotocol/v4-abacus';
import Long from 'long';
import type { IndexedTx } from '@cosmjs/stargate';

import {
  CompositeClient,
  IndexerConfig,
  type LocalWallet,
  Network,
  NetworkOptimizer,
  SubaccountClient,
  ValidatorConfig,
  OrderType,
  OrderSide,
  OrderTimeInForce,
  OrderExecution,
} from '@dydxprotocol/v4-client-js';

import {
  type AbacusDYDXChainTransactionsProtocol,
  QueryType,
  type QueryTypes,
  TransactionType,
  type TransactionTypes,
  type HumanReadablePlaceOrderPayload,
  type HumanReadableCancelOrderPayload,
} from '@/constants/abacus';

import { DialogTypes } from '@/constants/dialogs';

import { RootStore } from '@/state/_store';
import { openDialog } from '@/state/dialogs';

import { log } from '../telemetry';
import { StatefulOrderError } from '../errors';

class DydxChainTransactions implements AbacusDYDXChainTransactionsProtocol {
  private compositeClient: CompositeClient | undefined;
  private store: RootStore | undefined;
  private localWallet: LocalWallet | undefined;

  constructor() {
    this.compositeClient = undefined;
    this.store = undefined;
  }

  setStore(store: RootStore): void {
    this.store = store;
  }

  setLocalWallet(localWallet: LocalWallet) {
    this.localWallet = localWallet;
  }

  async connectNetwork(
    indexerUrl: string,
    indexerSocketUrl: string,
    validatorUrl: string,
    chainId: string,
    faucetUrl: Nullable<string> | undefined,
    callback: (p0: Nullable<string>) => void
  ): Promise<void> {
    try {
      const compositeClient = await CompositeClient.connect(
        new Network(
          chainId,
          new IndexerConfig(indexerUrl, indexerSocketUrl),
          new ValidatorConfig(validatorUrl, chainId, {
            broadcastPollIntervalMs: 3_000,
            broadcastTimeoutMs: 60_000,
          })
        )
      );

      this.compositeClient = compositeClient;

      // Dispatch custom event to notify other parts of the app that the network has been connected
      const customEvent = new CustomEvent('abacus:connectNetwork', {
        detail: {
          indexerUrl,
          indexerSocketUrl,
          validatorUrl,
          chainId,
          faucetUrl,
        },
      });

      globalThis.dispatchEvent(customEvent);
      callback(JSON.stringify({ success: true }));
    } catch (error) {
      this.store?.dispatch(
        openDialog({ type: DialogTypes.ExchangeOffline, dialogProps: { preventClose: true } })
      );

      log('DydxChainTransactions/connectNetwork', error);
      return;
    }
  }

  parseToPrimitives<T>(x: T): T {
    if (typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean' || x === null) {
      return x;
    }

    if (Array.isArray(x)) {
      return x.map((item) => this.parseToPrimitives(item)) as T;
    }

    if (Long.isLong(x)) {
      return x.toString() as T;
    }

    if (typeof x === 'object') {
      const parsedObj: { [key: string]: any } = {};
      for (const key in x) {
        if (Object.prototype.hasOwnProperty.call(x, key)) {
          parsedObj[key] = this.parseToPrimitives((x as any)[key]);
        }
      }
      return parsedObj as T;
    }

    throw new Error(`Unsupported data type: ${typeof x}`);
  }

  async placeOrderTransaction(params: HumanReadablePlaceOrderPayload): Promise<string> {
    if (!this.compositeClient || !this.localWallet)
      throw new Error('Missing compositeClient or localWallet');

    try {
      const {
        subaccountNumber,
        marketId,
        type,
        side,
        price,
        size,
        clientId,
        timeInForce,
        goodTilTimeInSeconds,
        execution,
        postOnly,
        reduceOnly,
        triggerPrice,
      } = params || {};

      const tx = await this.compositeClient?.placeOrder(
        new SubaccountClient(this.localWallet, subaccountNumber),
        marketId,
        type as OrderType,
        side as OrderSide,
        price,
        size,
        clientId,
        timeInForce as OrderTimeInForce,
        goodTilTimeInSeconds ?? 0,
        execution as OrderExecution,
        postOnly,
        reduceOnly,
        triggerPrice ?? undefined
      );

      // Handle stateful orders
      if ((tx as IndexedTx)?.code !== 0) {
        throw new StatefulOrderError('Stateful order has failed to commit.', tx);
      }

      const hash = tx?.hash && Buffer.from(tx.hash).toString('hex').toUpperCase();
      return JSON.stringify(tx);
    } catch (error) {
      log('DydxChainTransactions/placeOrderTransaction', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async cancelOrderTransaction(params: HumanReadableCancelOrderPayload): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    const { subaccountNumber, clientId, orderFlags, clobPairId, goodTilBlock, goodTilBlockTime } =
      params ?? {};

    try {
      const tx = await this.compositeClient?.cancelOrder(
        new SubaccountClient(this.localWallet, subaccountNumber),
        clientId,
        orderFlags,
        clobPairId,
        goodTilBlock ?? undefined,
        goodTilBlockTime ?? undefined
      );

      return JSON.stringify(tx);
    } catch (error) {
      log('DydxChainTransactions/cancelOrderTransaction', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async transaction(
    type: TransactionTypes,
    paramsInJson: Abacus.Nullable<string>,
    callback: (p0: Abacus.Nullable<string>) => void
  ): Promise<void> {
    try {
      const params = paramsInJson ? JSON.parse(paramsInJson) : undefined;

      switch (type) {
        case TransactionType.PlaceOrder: {
          const result = await this.placeOrderTransaction(params);
          callback(result);
          break;
        }
        case TransactionType.CancelOrder: {
          const result = await this.cancelOrderTransaction(params);
          callback(result);
          break;
        }
        default: {
          break;
        }
      }
    } catch (error) {
      try {
        const serializedError = JSON.stringify(error);
        callback(serializedError);
      } catch (parseError) {
        log('DydxChainTransactions/transaction', parseError);
      }

      log('DydxChainTransactions/transaction', error);
    }
  }

  async get(
    type: QueryTypes,
    paramsInJson: Abacus.Nullable<string>,
    callback: (p0: Abacus.Nullable<string>) => void
  ) {
    try {
      const params = paramsInJson ? JSON.parse(paramsInJson) : undefined;

      switch (type) {
        case QueryType.Height:
          const block = await this.compositeClient?.validatorClient.get.latestBlock();
          callback(JSON.stringify(block));
          break;
        case QueryType.OptimalNode:
          const networkOptimizer = new NetworkOptimizer();
          const optimalNode = await networkOptimizer.findOptimalNode(
            params.endpointUrls,
            params.chainId
          );
          callback(JSON.stringify({ url: optimalNode }));
          break;
        case QueryType.FeeTiers:
          const feeTiers = await this.compositeClient?.validatorClient.get.getFeeTiers();
          const parsedFeeTiers = this.parseToPrimitives(feeTiers);
          callback(JSON.stringify(parsedFeeTiers));
          break;
        case QueryType.UserFeeTier:
          const userFeeTier = await this.compositeClient?.validatorClient.get.getUserFeeTier(
            params.address
          );
          const parsedUserFeeTier = this.parseToPrimitives(userFeeTier);
          callback(JSON.stringify(parsedUserFeeTier));
          break;
        case QueryType.UserStats:
          const userStats = await this.compositeClient?.validatorClient.get.getUserStats(
            params.address
          );
          const parsedUserStats = this.parseToPrimitives(userStats);
          callback(JSON.stringify(parsedUserStats));
          break;
        // Do not implement Transfers (yet)
        case QueryType.Transfers:
        default:
          break;
      }
    } catch (error) {
      log('DydxChainTransactions/get', error);
      callback(null);
    }
  }
}

export default DydxChainTransactions;
