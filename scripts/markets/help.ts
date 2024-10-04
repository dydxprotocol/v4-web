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
import { spawn } from 'child_process';
import * as fs from 'fs';
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
  invert?: boolean;
  metadata_JSON?: string;
}

export enum ExchangeName {
  Binance = 'binance_ws',
  Bitfinex = 'bitfinex_ws',
  Bitstamp = 'bitstamp_api',
  Bybit = 'bybit_ws',
  CoinbasePro = 'coinbase_ws',
  CryptoCom = 'crypto_dot_com_ws',
  Gate = 'gate_ws',
  Huobi = 'huobi_ws',
  Kraken = 'kraken_api',
  Kucoin = 'kucoin_ws',
  Okx = 'okx_ws',
  Raydium = 'raydium_api',
  UniswapV3_Ethereum = 'uniswapv3_api-ethereum',
  UniswapV3_Base = 'uniswapv3_api-base',
  Polymarket = 'polymarket_api',
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


export enum PerpetualMarketType {
  /** PERPETUAL_MARKET_TYPE_UNSPECIFIED - Unspecified market type. */
  PERPETUAL_MARKET_TYPE_UNSPECIFIED = 0,

  /** PERPETUAL_MARKET_TYPE_CROSS - Market type for cross margin perpetual markets. */
  PERPETUAL_MARKET_TYPE_CROSS = 1,

  /** PERPETUAL_MARKET_TYPE_ISOLATED - Market type for isolated margin perpetual markets. */
  PERPETUAL_MARKET_TYPE_ISOLATED = 2,
  UNRECOGNIZED = -1,
}

interface Market {
  ticker: {
    currency_pair: {
      Base: string;
      Quote: string;
    };
    decimals: string;
    enabled: boolean;
    min_provider_count: string;
    metadata_JSON: string;
  };
  provider_configs: ProviderConfig[];
}

interface ProviderConfig {
  name: string;
  normalize_by_pair: {
    Base: string;
    Quote: string;
  } | null;
  off_chain_ticker: string;
  invert: boolean;
  metadata_JSON: string;
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

export async function createAndSendMarketMapProposal(
  proposals: Proposal[],
  validatorEndpoint: string,
  chainId: string,
  binary: string,
) {
  const markets: Market[] = proposals.map((proposal) => {
    const { ticker, priceExponent, minExchanges, exchangeConfigJson } = proposal.params;

    // Modify the ticker format, replace the last dash with a slash
    const modifiedTicker = ticker.replace(/-([^-]+)$/, '/$1');

    const providerConfigs: ProviderConfig[] = exchangeConfigJson.map((config) => {
      let normalize_by_pair: { Base: string; Quote: string } | null = null;

      if (config.adjustByMarket) {
        const [Base, Quote] = config.adjustByMarket.split('-');
        normalize_by_pair = { Base, Quote };
      }

      return {
        name: config.exchangeName,
        normalize_by_pair,
        off_chain_ticker: config.ticker,
        invert: config.invert || false,
        metadata_JSON: config.metadata_JSON ?? '',
      };
    });

    return {
      ticker: {
        currency_pair: {
          Base: modifiedTicker.split('/')[0],
          Quote: modifiedTicker.split('/')[1],
        },
        decimals: Math.abs(priceExponent).toString(),
        enabled: false,
        min_provider_count: minExchanges.toString(),
        metadata_JSON: '',
      },
      provider_configs: providerConfigs,
    };
  });

  const proposal = {
    "title": "Add markets to market map",
    "summary":"Add markets to market map",
    "messages": [
      {
        "@type": "/slinky.marketmap.v1.MsgUpsertMarkets",
        "authority": "dydx10d07y265gmmuvt4z0w9aw880jnsr700jnmapky",
        "markets": markets,
      },
    ],
    "deposit":"5000000000000000000adv4tnt",
    "expedited": true,
  };

  const proposalFile = 'marketMapProposal.json';
  fs.writeFileSync(proposalFile, JSON.stringify(proposal, null, 2), 'utf-8');

  try {
    await execCLI(binary, ['keys', 'show', 'alice']);
  } catch (error) {
    await execCLI(
      binary,
      ['keys', 'add', 'alice', '--recover'],
      'merge panther lobster crazy road hollow amused security before critic about cliff exhibit cause coyote talent happy where lion river tobacco option coconut small'
    )
  }

  await execCLI(
    binary,
    [
      '--node', validatorEndpoint,
      'tx', 'gov', 'submit-proposal', 'marketMapProposal.json',
      '--from', 'alice',
      '--fees', '2000000000000000000adv4tnt',
      '--chain-id', chainId,
      '--gas', 'auto'
    ],
    'y',
  )

  fs.unlinkSync(proposalFile);
}

export function execCLI(
  command: string,
  args?: string[],
  input?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);

    let output = '';

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(`Process exited with code: ${code}`);
      }
    });

    if (input) {
      process.stdin.write(`${input}\n`);
    }
    process.stdin.end();
  });
}
