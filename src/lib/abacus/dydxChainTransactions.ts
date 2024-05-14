import { EncodeObject } from '@cosmjs/proto-signing';
import type { IndexedTx } from '@cosmjs/stargate';
import Abacus, { type Nullable } from '@dydxprotocol/v4-abacus';
import {
  CompositeClient,
  GAS_MULTIPLIER,
  IndexerConfig,
  Network,
  NetworkOptimizer,
  NobleClient,
  OrderExecution,
  OrderSide,
  OrderTimeInForce,
  OrderType,
  SelectedGasDenom,
  SubaccountClient,
  ValidatorConfig,
  encodeJson,
  type LocalWallet,
} from '@dydxprotocol/v4-client-js';
import Long from 'long';

import {
  QueryType,
  TransactionType,
  type AbacusDYDXChainTransactionsProtocol,
  type HumanReadableCancelOrderPayload,
  type HumanReadablePlaceOrderPayload,
  type HumanReadableTransferPayload,
  type HumanReadableWithdrawPayload,
  type QueryTypes,
  type TransactionTypes,
} from '@/constants/abacus';
import { Hdkey } from '@/constants/account';
import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import { DydxChainId, isTestnet } from '@/constants/networks';
import { UNCOMMITTED_ORDER_TIMEOUT_MS } from '@/constants/trade';

import { RootStore } from '@/state/_store';
import { placeOrderTimeout } from '@/state/account';
import { setInitializationError } from '@/state/app';

import { signComplianceSignature } from '../compliance';
import { StatefulOrderError } from '../errors';
import { bytesToBigInt } from '../numbers';
import { log } from '../telemetry';
import { getMintscanTxLink, hashFromTx } from '../txUtils';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

class DydxChainTransactions implements AbacusDYDXChainTransactionsProtocol {
  private compositeClient: CompositeClient | undefined;
  private nobleClient: NobleClient | undefined;
  private store: RootStore | undefined;
  private hdkey: Hdkey | undefined;
  private localWallet: LocalWallet | undefined;
  private nobleWallet: LocalWallet | undefined;

  constructor() {
    this.compositeClient = undefined;
    this.store = undefined;
  }

  get isNobleClientConnected(): boolean {
    return this.nobleClient?.isConnected ?? false;
  }

  setStore(store: RootStore): void {
    this.store = store;
  }

  setHdkey(hdkey: Hdkey) {
    this.hdkey = hdkey;
  }

  setLocalWallet(localWallet: LocalWallet) {
    this.localWallet = localWallet;
  }

  setNobleWallet(nobleWallet: LocalWallet) {
    try {
      this.nobleWallet = nobleWallet;
      if (this.nobleClient) {
        this.nobleClient.connect(nobleWallet);
      }
    } catch (e) {
      log('DydxChainTransactions/setNobleWallet', e);
    }
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
        nobleValidatorUrl,
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
            },
            DEFAULT_TRANSACTION_MEMO
          )
        )
      );

      this.compositeClient = compositeClient;

      try {
        if (nobleValidatorUrl) {
          this.nobleClient = new NobleClient(nobleValidatorUrl);
          if (this.nobleWallet) await this.nobleClient.connect(this.nobleWallet);
        }
      } catch (e) {
        log('DydxChainTransactions/connectNetwork/NobleClient', e);
      }

      // Dispatch custom event to notify other parts of the app that the network has been connected
      const customEvent = new CustomEvent('abacus:connectNetwork', {
        detail: parsedParams,
      });

      globalThis.dispatchEvent(customEvent);
      callback(JSON.stringify({ success: true }));
    } catch (error) {
      this.store?.dispatch(setInitializationError(error?.message ?? 'Unknown error'));
      log('DydxChainTransactions/connectNetwork', error);
    }
  }

  setSelectedGasDenom(denom: SelectedGasDenom) {
    this.compositeClient?.setSelectedGasDenom(denom);
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

    if (typeof x === 'bigint') {
      return x.toString() as T;
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
        goodTilBlock,
        execution,
        postOnly,
        reduceOnly,
        triggerPrice,
      } = params || {};

      setTimeout(() => {
        this.store?.dispatch(placeOrderTimeout(clientId));
      }, UNCOMMITTED_ORDER_TIMEOUT_MS);

      const subaccountClient = new SubaccountClient(this.localWallet, subaccountNumber);
      console.log('params', params, subaccountClient, subaccountNumber === 128);

      // Place order
      const tx = await this.compositeClient?.placeOrder(
        subaccountClient,
        marketId,
        type as OrderType,
        side as OrderSide,
        price,
        size,
        clientId,
        timeInForce as OrderTimeInForce,
        goodTilTimeInSeconds ?? 0,
        execution as OrderExecution,
        postOnly ?? undefined,
        reduceOnly ?? undefined,
        triggerPrice ?? undefined,
        undefined,
        undefined,
        goodTilBlock ?? undefined
      );

      console.log('tx', tx, params);

      // Handle stateful orders
      if ((tx as IndexedTx)?.code !== 0) {
        throw new StatefulOrderError('Stateful order has failed to commit.', tx);
      }

      const encodedTx = encodeJson(tx);
      const parsedTx = JSON.parse(encodedTx);
      const hash = parsedTx.hash.toUpperCase();

      if (isTestnet) {
        console.log(
          getMintscanTxLink(this.compositeClient.network.getString() as DydxChainId, hash)
        );
      } else console.log(`txHash: ${hash}`);

      return encodedTx;
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

    const {
      orderId,
      subaccountNumber,
      clientId,
      orderFlags,
      clobPairId,
      goodTilBlock,
      goodTilBlockTime,
    } = params ?? {};

    try {
      const tx = await this.compositeClient?.cancelRawOrder(
        new SubaccountClient(this.localWallet, subaccountNumber),
        clientId,
        orderFlags,
        clobPairId,
        goodTilBlock || undefined,
        goodTilBlockTime || undefined
      );

      const encodedTx = encodeJson(tx);

      if (import.meta.env.MODE === 'development') {
        const parsedTx = JSON.parse(encodedTx);
        console.log(parsedTx, parsedTx.hash.toUpperCase());
      }

      return encodedTx;
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

  async sendNobleIBC(params: { msgTypeUrl: string; msg: any }): Promise<string> {
    if (!this.nobleClient?.isConnected) {
      throw new Error('Missing nobleClient or localWallet');
    }

    try {
      const ibcMsg = {
        typeUrl: params.msgTypeUrl, // '/ibc.applications.transfer.v1.MsgTransfer',
        value: {
          ...params.msg,
          timeoutTimestamp: params.msg.timeoutTimestamp
            ? // Squid returns timeoutTimestamp as Long, but the signer expects BigInt
              BigInt(Long.fromValue(params.msg.timeoutTimestamp).toString())
            : undefined,
        },
      };
      const fee = await this.nobleClient.simulateTransaction([ibcMsg]);

      // take out fee from amount before sweeping
      const amount =
        parseInt(ibcMsg.value.token.amount, 10) -
        Math.floor(parseInt(fee.amount[0].amount, 10) * GAS_MULTIPLIER);

      if (amount <= 0) {
        throw new Error('noble balance does not cover fees');
      }

      ibcMsg.value.token.amount = amount.toString();
      const tx = await this.nobleClient.send(
        [ibcMsg],
        undefined,
        `${DEFAULT_TRANSACTION_MEMO} | ${this.nobleWallet?.address}`
      );

      const parsedTx = this.parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/sendNobleIBC', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async withdrawToNobleIBC(params: {
    subaccountNumber: number;
    amount: string;
    ibcPayload: string;
  }): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    const { subaccountNumber, amount, ibcPayload } = params ?? {};
    const parsedIbcPayload: {
      msgTypeUrl: string;
      msg: any;
    } = ibcPayload ? JSON.parse(atob(ibcPayload)) : undefined;

    try {
      const msg = this.compositeClient.withdrawFromSubaccountMessage(
        new SubaccountClient(this.localWallet, subaccountNumber),
        parseFloat(amount).toFixed(this.compositeClient.validatorClient.config.denoms.USDC_DECIMALS)
      );
      const ibcMsg: EncodeObject = {
        typeUrl: parsedIbcPayload.msgTypeUrl,
        value: {
          ...parsedIbcPayload.msg,
          timeoutTimestamp: parsedIbcPayload.msg.timeoutTimestamp
            ? // Squid returns timeoutTimestamp as Long, but the signer expects BigInt
              BigInt(Long.fromValue(parsedIbcPayload.msg.timeoutTimestamp).toString())
            : undefined,
        },
      };

      const tx = await this.compositeClient.send(
        this.localWallet,
        () => Promise.resolve([msg, ibcMsg]),
        false
      );

      return JSON.stringify({
        txHash: hashFromTx(tx?.hash),
      });
    } catch (error) {
      log('DydxChainTransactions/withdrawToNobleIBC', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async cctpWithdraw(params: { typeUrl: string; value: any }): Promise<string> {
    if (!this.nobleClient?.isConnected) {
      throw new Error('Missing nobleClient or localWallet');
    }

    try {
      const ibcMsg = {
        typeUrl: params.typeUrl, // '/circle.cctp.v1.MsgDepositForBurn',
        value: params.value,
      };
      const fee = await this.nobleClient.simulateTransaction([ibcMsg]);

      // take out fee from amount before sweeping
      const amount =
        parseInt(ibcMsg.value.amount, 10) -
        Math.floor(parseInt(fee.amount[0].amount, 10) * GAS_MULTIPLIER);

      if (amount <= 0) {
        throw new Error('noble balance does not cover fees');
      }

      ibcMsg.value.amount = amount.toString();

      const tx = await this.nobleClient.send([ibcMsg]);

      const parsedTx = this.parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/cctpWithdraw', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async signCompliancePayload(params: {
    message: string;
    action: string;
    status: string;
  }): Promise<string> {
    if (!this.hdkey?.privateKey || !this.hdkey?.publicKey) {
      throw new Error('Missing hdkey');
    }

    try {
      const { signedMessage, timestamp } = await signComplianceSignature(
        params.message,
        params.action,
        params.status,
        this.hdkey
      );

      return JSON.stringify({
        signedMessage,
        publicKey: Buffer.from(this.hdkey.publicKey).toString('base64'),
        timestamp,
      });
    } catch (error) {
      log('DydxChainTransactions/signComplianceMessage', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async subaccountTransfer(params: {
    subaccountNumber: number;
    amount: string;
    destinationAddress: string;
    destinationSubaccountNumber: number;
  }): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    try {
      console.log(this.compositeClient.selectedGasDenom);

      const tx = await this.compositeClient.transferToSubaccount(
        new SubaccountClient(this.localWallet, params.subaccountNumber),
        params.destinationAddress,
        params.destinationSubaccountNumber,
        parseFloat(params.amount).toFixed(6)
      );

      const parsedTx = this.parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/subaccountTransfer', error);

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
        case TransactionType.SubaccountTransfer: {
          console.log({ subaccountTransferParams: params });
          const result = await this.subaccountTransfer(params);
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
        case TransactionType.SendNobleIBC: {
          const result = await this.sendNobleIBC(params);
          callback(result);
          break;
        }
        case TransactionType.WithdrawToNobleIBC: {
          const result = await this.withdrawToNobleIBC(params);
          callback(result);
          break;
        }
        case TransactionType.CctpWithdraw: {
          const result = await this.cctpWithdraw(params);
          callback(result);
          break;
        }
        case TransactionType.SignCompliancePayload: {
          const result = await this.signCompliancePayload(params);
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
        case QueryType.GetNobleBalance:
          if (this.nobleClient?.isConnected) {
            const nobleBalance = await this.nobleClient.getAccountBalance('uusdc');
            const parsedNobleBalance = this.parseToPrimitives(nobleBalance);
            callback(JSON.stringify(parsedNobleBalance));
          }
          break;
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
