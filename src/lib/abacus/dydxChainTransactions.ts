import { EncodeObject } from '@cosmjs/proto-signing';
import { type IndexedTx } from '@cosmjs/stargate';
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
  SubaccountClient,
  ValidatorConfig,
  encodeJson,
  type LocalWallet,
  type SelectedGasDenom,
} from '@dydxprotocol/v4-client-js';
import Long from 'long';

import {
  QueryType,
  QueryTypes,
  TransactionType,
  TransactionTypes,
  type AbacusDYDXChainTransactionsProtocol,
  type HumanReadableCancelOrderPayload,
  type HumanReadablePlaceOrderPayload,
  type HumanReadableTransferPayload,
  type HumanReadableWithdrawPayload,
} from '@/constants/abacus';
import {
  AnalyticsUserProperties,
  DEFAULT_TRANSACTION_MEMO,
  TransactionMemo,
} from '@/constants/analytics';
import { DydxChainId, isTestnet } from '@/constants/networks';
import { UNCOMMITTED_ORDER_TIMEOUT_MS } from '@/constants/trade';

import { type RootStore } from '@/state/_store';
import { setInitializationError } from '@/state/app';
import { placeOrderTimeout } from '@/state/localOrders';

import { identify } from '../analytics/analytics';
import { dd } from '../analytics/datadog';
import { StatefulOrderError, stringifyTransactionError } from '../errors';
import { parseToPrimitives } from '../parseToPrimitives';
import { log, logInfo } from '../telemetry';
import { browserTimeOffsetPromise } from '../timeOffset';
import { getMintscanTxLink, hashFromTx } from '../txUtils';

(BigInt.prototype as any).toJSON = function toJSON() {
  return this.toString();
};

class DydxChainTransactions implements AbacusDYDXChainTransactionsProtocol {
  private compositeClient: CompositeClient | undefined;

  private nobleClient: NobleClient | undefined;

  private store: RootStore | undefined;

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

  setLocalWallet(localWallet: LocalWallet) {
    this.localWallet = localWallet;
    if (this.localWallet.address) this.populateAccountNumberCache(this.localWallet.address);
  }

  clearAccounts() {
    this.localWallet = undefined;
    this.nobleWallet = undefined;
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
    let parsedParams;
    try {
      parsedParams = paramsInJson ? JSON.parse(paramsInJson) : {};
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

      logInfo('dydxChainTransactions connectNetwork', { parsedParams });
      identify(AnalyticsUserProperties.AbacusValidatorUrl(validatorUrl));

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
            DEFAULT_TRANSACTION_MEMO,
            true,
            (await browserTimeOffsetPromise).offset
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
        log('DydxChainTransactions/connectNetwork/NobleClient', e, parsedParams);
      }

      // Dispatch custom event to notify other parts of the app that the network has been connected
      const customEvent = new CustomEvent('abacus:connectNetwork', {
        detail: parsedParams,
      });

      globalThis.dispatchEvent(customEvent);
      callback(JSON.stringify({ success: true }));
      this.store?.dispatch(setInitializationError(undefined));
    } catch (error) {
      this.store?.dispatch(setInitializationError(error?.message ?? 'Unknown error'));
      log('DydxChainTransactions/connectNetwork', error, parsedParams);
    }
  }

  populateAccountNumberCache(address: string) {
    this.compositeClient?.populateAccountNumberCache(address);
  }

  setSelectedGasDenom(denom: SelectedGasDenom) {
    this.compositeClient?.setSelectedGasDenom(denom);
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
        marketInfo,
        currentHeight,
      } = params || {};

      setTimeout(() => {
        this.store?.dispatch(placeOrderTimeout(clientId));
      }, UNCOMMITTED_ORDER_TIMEOUT_MS);

      const subaccountClient = new SubaccountClient(this.localWallet, subaccountNumber);

      // Place order
      const tx = await this.compositeClient.placeOrder(
        subaccountClient,
        marketId,
        type as OrderType,
        side as OrderSide,
        price,
        size,
        parseInt(clientId, 10),
        timeInForce as OrderTimeInForce,
        goodTilTimeInSeconds ?? 0,
        execution as OrderExecution,
        postOnly ?? undefined,
        reduceOnly ?? undefined,
        triggerPrice ?? undefined,
        marketInfo ?? undefined,
        currentHeight ?? undefined,
        goodTilBlock ?? undefined,
        TransactionMemo.placeOrder
      );

      // Handle stateful orders
      if ((tx as IndexedTx | undefined)?.code !== 0) {
        throw new StatefulOrderError('Stateful order has failed to commit.', tx);
      }

      const encodedTx = encodeJson(tx);
      const parsedTx = JSON.parse(encodedTx);
      const hash = parsedTx.hash.toUpperCase();

      if (isTestnet) {
        // eslint-disable-next-line no-console
        console.log(
          getMintscanTxLink(this.compositeClient.network.getString() as DydxChainId, hash)
        );
        // eslint-disable-next-line no-console
      } else console.log(`txHash: ${hash}`);

      return encodedTx;
    } catch (error) {
      if (error?.name !== 'BroadcastError') {
        log('DydxChainTransactions/placeOrderTransaction', error);
      }
      return stringifyTransactionError(error);
    }
  }

  async cancelOrderTransaction(params: HumanReadableCancelOrderPayload): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    const { subaccountNumber, clientId, orderFlags, clobPairId, goodTilBlock, goodTilBlockTime } =
      params ?? {};

    try {
      const tx = await this.compositeClient.cancelRawOrder(
        new SubaccountClient(this.localWallet, subaccountNumber),
        parseInt(clientId, 10),
        orderFlags,
        clobPairId,
        goodTilBlock === 0 ? undefined : goodTilBlock ?? undefined,
        goodTilBlockTime === 0 ? undefined : goodTilBlockTime ?? undefined
      );

      const encodedTx = encodeJson(tx);

      if (import.meta.env.MODE === 'development') {
        const parsedTx = JSON.parse(encodedTx);
        // eslint-disable-next-line no-console
        console.log(parsedTx, parsedTx.hash.toUpperCase());
      }

      return encodedTx;
    } catch (error) {
      log('DydxChainTransactions/cancelOrderTransaction', error);
      return stringifyTransactionError(error);
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

      const parsedTx = parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/simulateWithdrawTransaction', error);
      return stringifyTransactionError(error);
    }
  }

  async simulateTransferNativeTokenTransaction(
    params: HumanReadableTransferPayload
  ): Promise<string> {
    if (!this.compositeClient || !this.localWallet) {
      throw new Error('Missing compositeClient or localWallet');
    }

    const { amount, recipient } = params ?? {};
    const compositeClient = this.compositeClient;

    try {
      const tx = await compositeClient.simulate(
        this.localWallet,
        () =>
          new Promise((resolve) => {
            if (!this.localWallet) {
              throw new Error('Missing compositeClient or localWallet');
            }
            const msg = compositeClient.sendTokenMessage(this.localWallet, amount, recipient);

            resolve([msg]);
          }),
        this.compositeClient.validatorClient.post.defaultDydxGasPrice
      );

      const parsedTx = parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/simulateTransferNativeTokenTransaction', error);
      return stringifyTransactionError(error);
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
            ? // Skip returns timeoutTimestamp as Long, but the signer expects BigInt
              BigInt(Long.fromValue(params.msg.timeoutTimestamp).toString())
            : undefined,
        },
      };
      const fee = await this.nobleClient.simulateTransaction([ibcMsg]);

      // take out fee from amount before sweeping
      const amount =
        parseInt(ibcMsg.value.token.amount, 10) -
        Math.floor(parseInt(fee.amount[0]!.amount, 10) * GAS_MULTIPLIER);

      if (amount <= 0) {
        throw new Error('noble balance does not cover fees');
      }

      ibcMsg.value.token.amount = amount.toString();

      dd.info('sendNobleIBC attempting to submit tx', { ibcMsg, fee, amount });
      const tx = await this.nobleClient.send(
        [ibcMsg],
        undefined,
        `${DEFAULT_TRANSACTION_MEMO} | ${this.nobleWallet?.address}`
      );

      const parsedTx = parseToPrimitives(tx);
      dd.info('sendNobleIBC tx submitted', { tx, ibcMsg });

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/sendNobleIBC', error);
      return stringifyTransactionError(error);
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
            ? // Skip returns timeoutTimestamp as Long, but the signer expects BigInt
              BigInt(Long.fromValue(parsedIbcPayload.msg.timeoutTimestamp).toString())
            : undefined,
        },
      };

      dd.info('withdrawToNobleIBC attempting to submit tx', { ibcMsg });

      const tx = await this.compositeClient.send(
        this.localWallet,
        () => Promise.resolve([msg, ibcMsg]),
        false
      );

      dd.info('withdrawToNobleIBC tx submitted', { tx, ibcMsg });

      return JSON.stringify({
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        txHash: hashFromTx(tx?.hash),
      });
    } catch (error) {
      log('DydxChainTransactions/withdrawToNobleIBC', error);
      return stringifyTransactionError(error);
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
        Math.floor(parseInt(fee.amount[0]!.amount, 10) * GAS_MULTIPLIER);

      if (amount <= 0) {
        throw new Error('noble balance does not cover fees');
      }

      ibcMsg.value.amount = amount.toString();

      dd.info('cctpWithdraw attempting to submit tx', { ibcMsg, fee, amount });

      const tx = await this.nobleClient.send([ibcMsg]);

      dd.info('cctpWithdraw tx submitted', { tx, ibcMsg });

      const parsedTx = parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/cctpWithdraw', error);
      return stringifyTransactionError(error);
    }
  }

  async cctpMultiMsgWithdraw(messages: { typeUrl: string; value: any }[]): Promise<string> {
    if (!this.nobleClient?.isConnected) {
      throw new Error('Missing nobleClient or localWallet');
    }

    try {
      const ibcMsgs = messages.map(({ typeUrl, value }) => ({
        typeUrl, // '/circle.cctp.v1.MsgDepositForBurnWithCaller', '/cosmos.bank.v1beta1.MsgSend'
        value,
      }));

      const fee = await this.nobleClient.simulateTransaction(ibcMsgs);

      // take out fee from amount before sweeping
      const amount =
        parseInt(ibcMsgs[0]!.value.amount, 10) -
        Math.floor(parseInt(fee.amount[0]!.amount, 10) * GAS_MULTIPLIER);

      if (amount <= 0) {
        throw new Error('noble balance does not cover fees');
      }

      ibcMsgs[0]!.value.amount = amount.toString();

      dd.info('cctpMultiMsgWithdraw attempting to submit tx', { ibcMsgs, fee, amount });
      const tx = await this.nobleClient.send(ibcMsgs);
      dd.info('cctpMultiMsgWithdraw tx submitted', { tx, ibcMsgs });

      const parsedTx = parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/cctpMultiMsgWithdraw', error);

      return JSON.stringify({
        error,
      });
    }
  }

  async subaccountTransfer(params: {
    senderAddress: string;
    subaccountNumber: number;
    amount: string;
    destinationAddress: string;
    destinationSubaccountNumber: number;
  }): Promise<string> {
    try {
      if (!this.compositeClient || !this.localWallet) {
        throw new Error('Missing compositeClient or localWallet');
      }

      if (params.senderAddress !== this.localWallet.address) {
        throw new Error('Sender address does not match local wallet');
      }

      const isIsolatedCancel =
        params.senderAddress === params.destinationAddress &&
        params.destinationSubaccountNumber === 0;

      const tx = await this.compositeClient.transferToSubaccount(
        new SubaccountClient(this.localWallet, params.subaccountNumber),
        params.destinationAddress,
        params.destinationSubaccountNumber,
        parseFloat(params.amount).toFixed(6),
        isIsolatedCancel ? TransactionMemo.cancelOrderTransfer : DEFAULT_TRANSACTION_MEMO
      );

      const parsedTx = parseToPrimitives(tx);

      return JSON.stringify(parsedTx);
    } catch (error) {
      log('DydxChainTransactions/subaccountTransfer', error);
      return stringifyTransactionError(error);
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
          // this is now handled in bonsai, so the abacus call is a no-op
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
        case TransactionType.CctpMultiMsgWithdraw: {
          const result = await this.cctpMultiMsgWithdraw(params);
          callback(result);
          break;
        }
        case TransactionType.SignCompliancePayload: {
          // this is now handled in bonsai, so the abacus call is a no-op
          break;
        }
        default: {
          break;
        }
      }
    } catch (error) {
      try {
        const serializedError = stringifyTransactionError(error);
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
        case QueryType.Height: {
          const block = await this.compositeClient?.validatorClient.get.latestBlock();
          callback(JSON.stringify(block));
          break;
        }
        case QueryType.OptimalNode: {
          const networkOptimizer = new NetworkOptimizer();
          const optimalNode = await networkOptimizer.findOptimalNode(
            params.endpointUrls,
            params.chainId
          );
          callback(JSON.stringify({ url: optimalNode }));
          break;
        }
        case QueryType.EquityTiers: {
          const equityTiers =
            await this.compositeClient?.validatorClient.get.getEquityTierLimitConfiguration();
          const parsedEquityTiers = parseToPrimitives(equityTiers);
          callback(JSON.stringify(parsedEquityTiers));
          break;
        }
        case QueryType.FeeTiers: {
          const feeTiers = await this.compositeClient?.validatorClient.get.getFeeTiers();
          const parsedFeeTiers = parseToPrimitives(feeTiers);
          callback(JSON.stringify(parsedFeeTiers));
          break;
        }
        case QueryType.UserFeeTier: {
          const userFeeTier = await this.compositeClient?.validatorClient.get.getUserFeeTier(
            params.address
          );
          const parsedUserFeeTier = parseToPrimitives(userFeeTier);
          callback(JSON.stringify(parsedUserFeeTier));
          break;
        }
        case QueryType.UserStats: {
          const userStats = await this.compositeClient?.validatorClient.get.getUserStats(
            params.address
          );
          const parsedUserStats = parseToPrimitives(userStats);
          callback(JSON.stringify(parsedUserStats));
          break;
        }
        case QueryType.GetAccountBalances: {
          if (!this.localWallet?.address) throw new Error('Missing localWallet');
          const accountBalances =
            await this.compositeClient?.validatorClient.get.getAccountBalances(
              this.localWallet.address
            );
          const parsedAccountBalances = parseToPrimitives(accountBalances);
          callback(JSON.stringify(parsedAccountBalances));
          break;
        }
        case QueryType.RewardsParams: {
          const rewardsParams = await this.compositeClient?.validatorClient.get.getRewardsParams();
          const parsedRewardsParams = parseToPrimitives(rewardsParams);
          callback(JSON.stringify(parsedRewardsParams));
          break;
        }
        case QueryType.GetMarketPrice: {
          const price = await this.compositeClient?.validatorClient.get.getPrice(params.marketId);
          const parsedPrice = parseToPrimitives(price);
          callback(JSON.stringify(parsedPrice));
          break;
        }
        case QueryType.GetDelegations: {
          const delegations =
            await this.compositeClient?.validatorClient.get.getDelegatorDelegations(params.address);
          const parseDelegations = parseToPrimitives(delegations);
          callback(JSON.stringify(parseDelegations));
          break;
        }
        case QueryType.GetNobleBalance: {
          if (this.nobleClient?.isConnected) {
            const nobleBalance = await this.nobleClient.getAccountBalance('uusdc');
            const parsedNobleBalance = parseToPrimitives(nobleBalance);
            callback(JSON.stringify(parsedNobleBalance));
          }
          break;
        }
        case QueryType.GetStakingRewards: {
          const rewards = await this.compositeClient?.validatorClient.get.getDelegationTotalRewards(
            params.address
          );
          const parsedRewards = parseToPrimitives(rewards);
          callback(JSON.stringify(parsedRewards));
          break;
        }
        case QueryType.GetCurrentUnstaking: {
          const unbonding =
            await this.compositeClient?.validatorClient.get.getDelegatorUnbondingDelegations(
              params.address
            );
          const parseUnbonding = parseToPrimitives(unbonding);
          callback(JSON.stringify(parseUnbonding));
          break;
        }
        default: {
          break;
        }
      }
    } catch (error) {
      log('DydxChainTransactions/get', error, { type, paramsInJson });
      callback(null);
    }
  }
}

export default DydxChainTransactions;
