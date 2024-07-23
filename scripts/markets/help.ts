import { EncodeObject } from '@cosmjs/proto-signing';
import { Account, StdFee } from '@cosmjs/stargate';
import { Method } from '@cosmjs/tendermint-rpc';
import { BroadcastTxSyncResponse } from '@cosmjs/tendermint-rpc/build/tendermint37';
import {
  CompositeClient,
  LocalWallet as LocalWalletType,
  TransactionOptions,
  VoteOption,
} from '@dydxprotocol/v4-client-js';
import { MsgVote } from '@dydxprotocol/v4-proto/src/codegen/cosmos/gov/v1/tx';
import Long from 'long';

const VOTE_FEE: StdFee = {
  amount: [
    {
      amount: '25000000000000000',
      denom: 'adv4tnt',
    },
  ],
  gas: '1000000',
};

export interface Exchange {
  exchangeName: ExchangeName;
  ticker: string;
  adjustByMarket?: string;
}

export enum ExchangeName {
  Binance = 'Binance',
  BinanceUS = 'BinanceUS',
  Bitfinex = 'Bitfinex',
  Bitstamp = 'Bitstamp',
  Bybit = 'Bybit',
  CoinbasePro = 'CoinbasePro',
  CryptoCom = 'CryptoCom',
  Gate = 'Gate',
  Huobi = 'Huobi',
  Kraken = 'Kraken',
  Kucoin = 'Kucoin',
  Mexc = 'Mexc',
  Okx = 'Okx',
  Raydium = 'Raydium',
}

export interface Params {
  id: number;
  ticker: string;
  marketType: 'PERPETUAL_MARKET_TYPE_ISOLATED' | 'PERPETUAL_MARKET_TYPE_CROSS';
  priceExponent: number;
  minPriceChange: number;
  minExchanges: number;
  exchangeConfigJson: Exchange[];
  liquidityTier: number;
  atomicResolution: number;
  quantumConversionExponent: number;
  defaultFundingPpm: number;
  stepBaseQuantums: number;
  subticksPerTick: number;
  delayBlocks: number;
}

export interface Proposal {
  id: Long.Long;
  title: string;
  summary: string;
  params: Params;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 5,
  delay: number = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Function ${fn.name} failed: ${error}. Retrying in ${delay}ms...`);
    if (retries <= 0) {
      throw error;
    }
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
}

// Vote YES on all `proposalIds` from `wallet`.
export async function voteOnProposals(
  proposalIds: number[],
  client: CompositeClient,
  wallet: LocalWalletType
): Promise<void> {
  // Construct Tx.
  const encodedVotes: EncodeObject[] = proposalIds.map((proposalId) => {
    return {
      typeUrl: '/cosmos.gov.v1.MsgVote',
      value: {
        proposalId: Long.fromNumber(proposalId),
        voter: wallet.address!,
        option: VoteOption.VOTE_OPTION_YES,
        metadata: '',
      } as MsgVote,
    } as EncodeObject;
  });
  const account: Account = await client.validatorClient.get.getAccount(wallet.address!);
  const signedTx = await wallet.signTransaction(
    encodedVotes,
    {
      sequence: account.sequence,
      accountNumber: account.accountNumber,
      chainId: client.network.validatorConfig.chainId,
    } as TransactionOptions,
    VOTE_FEE
  );

  // Broadcast Tx.
  const resp = await client.validatorClient.get.tendermintClient.broadcastTransaction(
    signedTx,
    Method.BroadcastTxSync
  );
  if ((resp as BroadcastTxSyncResponse).code) {
    throw new Error(`Failed to vote on proposals ${proposalIds}`);
  } else {
    console.log(`Voted on proposals ${proposalIds} with wallet ${wallet.address}`);
  }
}