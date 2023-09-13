import Abacus, { Nullable } from '@dydxprotocol/v4-abacus';
import Long from 'long';

import {
  CompositeClient,
  IndexerConfig,
  Network,
  NetworkOptimizer,
  ValidatorConfig,
} from '@dydxprotocol/v4-client-js';

import {
  type AbacusDYDXChainTransactionsProtocol,
  QueryType,
  type QueryTypes,
  type TransactionTypes,
} from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';

import { RootStore } from '@/state/_store';
import { openDialog } from '@/state/dialogs';

import { log } from '../telemetry';

class DydxChainTransactions implements AbacusDYDXChainTransactionsProtocol {
  private compositeClient: CompositeClient | undefined;
  private store: RootStore | undefined;

  constructor() {
    this.compositeClient = undefined;
    this.store = undefined;
  }

  setStore(store: RootStore): void {
    this.store = store;
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

  async transaction(
    type: TransactionTypes,
    paramsInJson: Abacus.Nullable<string>,
    callback: (p0: Abacus.Nullable<string>) => void
  ): Promise<void> {
    // To be implemented
    return;
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
