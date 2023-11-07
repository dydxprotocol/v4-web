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
  type HumanReadableWithdrawPayload,
  type HumanReadableTransferPayload,
} from '@/constants/abacus';

import { DialogTypes } from '@/constants/dialogs';
import { UNCOMMITTED_ORDER_TIMEOUT_MS } from '@/constants/trade';
import { ENVIRONMENT_CONFIG_MAP, DydxNetwork, isTestnet } from '@/constants/networks';

import { RootStore } from '@/state/_store';
import { addUncommittedOrderClientId, removeUncommittedOrderClientId } from '@/state/account';
import { openDialog } from '@/state/dialogs';

import { StatefulOrderError } from '../errors';
import { bytesToBigInt } from '../numbers';
import { log } from '../telemetry';

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
    paramsInJson: Nullable<string>,
    callback: (p0: Nullable<string>) => void
  ): Promise<void> {
    try {
      const parsedParams = paramsInJson ? JSON.parse(paramsInJson) : {};
      const {
        indexerUrl,
        websocketUrl,
        validatorUrl,
        chainId,
        USDC_DENOM,
        USDC_DECIMALS,
        USDC_GAS_DENOM,
        CHAINTOKEN_DENOM,
        CHAINTOKEN_DECIMALS,
      } = parsedParams;

      const compositeClient = await CompositeClient.connect(
        new Network(
          chainId,
          new IndexerConfig(indexerUrl, websocketUrl),
          new ValidatorConfig(
            validatorUrl,
            chainId,
            {
              USDC_DENOM,
              USDC_DECIMALS,
              USDC_GAS_DENOM,
              CHAINTOKEN_DENOM,
              CHAINTOKEN_DECIMALS,
            },
            {
              broadcastPollIntervalMs: 3_000,
              broadcastTimeoutMs: 60_000,
            }
          )
        )
      );

      this.compositeClient = compositeClient;

      // Dispatch custom event to notify other parts of the app that the network has been connected
      const customEvent = new CustomEvent('abacus:connectNetwork', {
        detail: parsedParams,
      });

      globalThis.dispatchEvent(customEvent);
      callback(JSON.stringify({ success: true }));
    } catch (error) {
      this.store?.dispatch(
        openDialog({ type: DialogTypes.ExchangeOffline, dialogProps: { preventClose: true } })
      );
      log('DydxChainTransactions/connectNetwork', error);
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

    if (x instanceof Uint8Array) {
      return bytesToBigInt(x).toString() as T;
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

      // Observe uncommitted order
      this.store?.dispatch(addUncommittedOrderClientId(clientId));

      setTimeout(() => {
        this.store?.dispatch(removeUncommittedOrderClientId(clientId));
      }, UNCOMMITTED_ORDER_TIMEOUT_MS);

      // Place order
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

      const parsedTx = this.parseToPrimitives(tx);
      const hash = parsedTx?.hash;

      if (isTestnet) {
        console.log(
          `${
            ENVIRONMENT_CONFIG_MAP[this.compositeClient.network.getString() as DydxNetwork]?.links
              ?.mintscanBase
          }/txs/${hash}`
        );
      } else console.log(`txHash: ${hash}`);

      return JSON.stringify(parsedTx);
    } catch (error) {
      if (error?.name !== 'BroadcastError') {
        log('DydxChainTransactions/placeOrderTransaction', error);
      }

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
      const tx = await this.compositeClient?.cancelRawOrder(
        new SubaccountClient(this.localWallet, subaccountNumber),
        clientId,
        orderFlags,
        clobPairId,
        goodTilBlock || undefined,
        goodTilBlockTime || undefined
      );

      const parsedTx = this.parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/cancelOrderTransaction', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async simulateWithdrawTransaction(params: HumanReadableWithdrawPayload): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    const { subaccountNumber, amount } = params ?? {};
    const compositeClient = this.compositeClient;
    const subaccountClient = new SubaccountClient(this.localWallet, subaccountNumber);

    try {
      const tx = await compositeClient.simulate(
        this.localWallet,
        () =>
          new Promise((resolve) => {
            const msg = compositeClient.withdrawFromSubaccountMessage(subaccountClient, amount);

            resolve([msg]);
          })
      );

      const parsedTx = this.parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/simulateWithdrawTransaction', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async simulateTransferNativeTokenTransaction(
    params: HumanReadableTransferPayload
  ): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    const { subaccountNumber, amount, recipient } = params ?? {};
    const compositeClient = this.compositeClient;
    const subaccountClient = new SubaccountClient(this.localWallet, subaccountNumber);

    try {
      const tx = await compositeClient.simulate(
        this.localWallet,
        () =>
          new Promise((resolve) => {
            if (!this.localWallet) {
              throw new Error('Missing compositeClient or localWallet');
            }
            const msg = compositeClient?.sendTokenMessage(this.localWallet, amount, recipient);

            resolve([msg]);
          }),
        this.compositeClient?.validatorClient?.post.defaultDydxGasPrice
      );

      const parsedTx = this.parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/simulateTransferNativeTokenTransaction', error);

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
        case TransactionType.simulateWithdraw: {
          const result = await this.simulateWithdrawTransaction(params);
          callback(result);
          break;
        }
        case TransactionType.simulateTransferNativeToken: {
          const result = await this.simulateTransferNativeTokenTransaction(params);
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
        case QueryType.EquityTiers:
          const equityTiers =
            await this.compositeClient?.validatorClient.get.getEquityTierLimitConfiguration();
          const parsedEquityTiers = this.parseToPrimitives(equityTiers);
          callback(JSON.stringify(parsedEquityTiers));
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
        case QueryType.GetAccountBalances:
          if (!this.localWallet?.address) throw new Error('Missing localWallet');
          const accountBalances =
            await this.compositeClient?.validatorClient.get.getAccountBalances(
              this.localWallet.address
            );
          const parsedAccountBalances = this.parseToPrimitives(accountBalances);
          callback(JSON.stringify(parsedAccountBalances));
          break;
        case QueryType.RewardsParams:
          const rewardsParams = await this.compositeClient?.validatorClient.get.getRewardsParams();
          const parsedRewardsParams = this.parseToPrimitives(rewardsParams);
          callback(JSON.stringify(parsedRewardsParams));
          break;
        case QueryType.GetMarketPrice:
          const price = await this.compositeClient?.validatorClient.get.getPrice(params.marketId);
          const parsedPrice = this.parseToPrimitives(price);
          callback(JSON.stringify(parsedPrice));
          break;
        case QueryType.GetDelegations:
          const delegations =
            await this.compositeClient?.validatorClient.get.getDelegatorDelegations(params.address);
          const parseDelegations = this.parseToPrimitives(delegations);
          callback(JSON.stringify(parseDelegations));
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
