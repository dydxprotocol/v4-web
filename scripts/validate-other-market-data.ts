/* eslint-disable import/no-extraneous-dependencies */

/* eslint-disable no-plusplus */

/* eslint-disable no-console */

/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */
import { EncodeObject } from '@cosmjs/proto-signing';
import { Account, StdFee } from '@cosmjs/stargate';
import { Method } from '@cosmjs/tendermint-rpc';
import { BroadcastTxSyncResponse } from '@cosmjs/tendermint-rpc/build/tendermint37';
import {
  CompositeClient,
  LocalWallet as LocalWalletType,
  Network,
  ProposalStatus,
  TransactionOptions,
  VoteOption,
} from '@dydxprotocol/v4-client-js';
import { MsgVote } from '@dydxprotocol/v4-proto/src/codegen/cosmos/gov/v1/tx';
import { ClobPair } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/clob/clob_pair';
import { Perpetual } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/perpetuals/perpetual';
import { PerpetualMarketType } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/dydxprotocol/perpetuals/perpetual';
import { MarketPrice } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/prices/market_price';
import Ajv from 'ajv';
import axios from 'axios';
import { readFileSync } from 'fs';
import Long from 'long';

const LocalWalletModule = await import(
  '@dydxprotocol/v4-client-js/src/clients/modules/local-wallet'
);
const LocalWallet = LocalWalletModule.default;

const PATH_TO_PROPOSALS = 'public/configs/otherMarketData.json';
// TODO: Query MIN_DEPOSIT and VOTING_PERIOD_SECONDS from chain.
const MIN_DEPOSIT = '10000000';
const VOTING_PERIOD_SECONDS = 300;
const VOTE_FEE: StdFee = {
  amount: [
    {
      amount: '25000000000000000',
      denom: 'adv4tnt',
    },
  ],
  gas: '1000000',
};

const MNEMONICS = [
  // alice
  // Consensus Address: dydxvalcons1zf9csp5ygq95cqyxh48w3qkuckmpealrw2ug4d
  'merge panther lobster crazy road hollow amused security before critic about cliff exhibit cause coyote talent happy where lion river tobacco option coconut small',

  // bob
  // Consensus Address: dydxvalcons1s7wykslt83kayxuaktep9fw8qxe5n73ucftkh4
  'color habit donor nurse dinosaur stable wonder process post perfect raven gold census inside worth inquiry mammal panic olive toss shadow strong name drum',

  // carl
  // Consensus Address: dydxvalcons1vy0nrh7l4rtezrsakaadz4mngwlpdmhy64h0ls
  'school artefact ghost shop exchange slender letter debris dose window alarm hurt whale tiger find found island what engine ketchup globe obtain glory manage',

  // dave
  // Consensus Address: dydxvalcons1stjspktkshgcsv8sneqk2vs2ws0nw2wr272vtt
  'switch boring kiss cash lizard coconut romance hurry sniff bus accident zone chest height merit elevator furnace eagle fetch quit toward steak mystery nest',
];

interface Exchange {
  exchangeName: ExchangeName;
  ticker: string;
  adjustByMarket?: string;
}

interface Params {
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

interface Proposal {
  title: string;
  summary: string;
  params: Params;
}

enum ExchangeName {
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
}

interface ExchangeInfo {
  url: string;
  tickers: Map<string, any> | null;
  parseResp: (response: any) => Map<string, any>;
}

const EXCHANGE_INFO: { [key in ExchangeName]: ExchangeInfo } = {
  [ExchangeName.Binance]: {
    url: 'https://data-api.binance.vision/api/v3/ticker/24hr',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.symbol, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.BinanceUS]: {
    url: 'https://api.binance.us/api/v3/ticker/24hr',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.symbol, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Bitfinex]: {
    url: 'https://api-pub.bitfinex.com/v2/tickers?symbols=ALL',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item[0], {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Bitstamp]: {
    url: 'https://www.bitstamp.net/api/v2/ticker/',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.pair, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Bybit]: {
    url: 'https://api.bybit.com/v5/market/tickers?category=spot',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.result.list).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.symbol, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.CoinbasePro]: {
    url: 'https://api.exchange.coinbase.com/products',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.id, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.CryptoCom]: {
    url: 'https://api.crypto.com/v2/public/get-ticker',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.result.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.i, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Gate]: {
    url: 'https://api.gateio.ws/api/v4/spot/tickers',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.currency_pair, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Huobi]: {
    url: 'https://api.huobi.pro/market/tickers',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.symbol, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Kraken]: {
    url: 'https://api.kraken.com/0/public/Ticker',
    tickers: null,
    parseResp: (response: any) => {
      return new Map<string, any>(Object.entries(response.result));
    },
  },
  [ExchangeName.Kucoin]: {
    url: 'https://api.kucoin.com/api/v1/market/allTickers',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data.ticker).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.symbol, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Mexc]: {
    url: 'https://www.mexc.com/open/api/v2/market/ticker',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.symbol, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Okx]: {
    url: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.instId, {});
        return acc;
      }, new Map<string, any>());
    },
  },
};

async function validateExchangeConfigJson(exchangeConfigJson: Exchange[]): Promise<void> {
  const exchanges: Set<ExchangeName> = new Set();
  for (const exchange of exchangeConfigJson) {
    if (!(exchange.exchangeName in EXCHANGE_INFO)) {
      throw new Error(`Exchange ${exchange.exchangeName} not supported`);
    }
    // Each exchange should be unique.
    if (exchanges.has(exchange.exchangeName)) {
      throw new Error(`Found duplicate exchange: ${exchange.exchangeName}`);
    }
    exchanges.add(exchange.exchangeName);

    // `adjustByMarket` should be set if ticker doesn't end in usd or USD.
    if (
      (!/usd$/i.test(exchange.ticker) && exchange.adjustByMarket === undefined) ||
      exchange.adjustByMarket === ''
    ) {
      throw new Error(
        `adjustByMarket is not set for ticker ${exchange.ticker} on exchange ${exchange.exchangeName}`
      );
    }
    const { url, tickers, parseResp } = EXCHANGE_INFO[exchange.exchangeName];

    // TODO: Skip Bybit exchange until we can query from non-US IP.
    if (exchange.exchangeName === ExchangeName.Bybit) {
      return; // exit the current iteration of the loop.
    }

    // Query exchange tickers if not yet.
    if (tickers === null) {
      try {
        const response = await axios.get(url);
        EXCHANGE_INFO[exchange.exchangeName].tickers = parseResp(response.data);
        console.log(`Fetched tickers from exchange ${exchange.exchangeName}`);
      } catch (error) {
        throw new Error(`Error fetching tickers for exchange ${exchange.exchangeName}: ${error}`);
      }
    }

    // Validate ticker.
    if (!EXCHANGE_INFO[exchange.exchangeName].tickers?.has(exchange.ticker)) {
      throw new Error(`Ticker ${exchange.ticker} not found for exchange ${exchange.exchangeName}`);
    }
    console.log(`Validated ticker ${exchange.ticker} for exchange ${exchange.exchangeName}`);
  }
}

// Vote YES on all `proposalIds` from `wallet`.
async function voteOnProposals(
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

async function validateAgainstLocalnet(proposals: Proposal[]): Promise<void> {
  // Initialize wallets.
  const network = Network.local();
  const client = await CompositeClient.connect(network);
  const wallets: LocalWalletType[] = await Promise.all(
    MNEMONICS.map((mnemonic) => {
      return LocalWallet.fromMnemonic(mnemonic, 'dydx');
    })
  );

  // Send proposals to add all markets (unless a market with that ticker already exists).
  const allPerps = await client.validatorClient.get.getAllPerpetuals();
  const allTickers = allPerps.perpetual.map((perp) => perp.params!.ticker);
  const filteredProposals = proposals.filter(
    (proposal) => !allTickers.includes(proposal.params.ticker)
  );
  const numExistingMarkets = allPerps.perpetual.reduce(
    (max, perp) => (perp.params!.id > max ? perp.params!.id : max),
    0
  );
  const marketsProposed = new Map<number, Proposal>(); // marketId -> Proposal

  for (let i = 0; i < filteredProposals.length; i += 4) {
    // Send out proposals in groups of 4 or fewer.
    const proposalsToSend = filteredProposals.slice(i, i + 4);
    const proposalIds: number[] = [];
    for (let j = 0; j < proposalsToSend.length; j++) {
      // Use wallets[j] to send out proposalsToSend[j]
      const proposal = proposalsToSend[j];
      const proposalId: number = i + j + 1;
      const marketId: number = numExistingMarkets + proposalId;

      // Send proposal.
      const exchangeConfigString = `{"exchanges":${JSON.stringify(
        proposal.params.exchangeConfigJson
      )}}`;
      const tx = await retry(() =>
        client.submitGovAddNewMarketProposal(
          wallets[j],
          {
            id: marketId,
            ticker: proposal.params.ticker,
            priceExponent: proposal.params.priceExponent,
            minPriceChange: proposal.params.minPriceChange,
            minExchanges: proposal.params.minExchanges,
            exchangeConfigJson: exchangeConfigString,
            liquidityTier: proposal.params.liquidityTier,
            atomicResolution: proposal.params.atomicResolution,
            quantumConversionExponent: proposal.params.quantumConversionExponent,
            stepBaseQuantums: Long.fromNumber(proposal.params.stepBaseQuantums),
            subticksPerTick: proposal.params.subticksPerTick,
            delayBlocks: proposal.params.delayBlocks,
            marketType:
              proposal.params.marketType === 'PERPETUAL_MARKET_TYPE_ISOLATED'
                ? PerpetualMarketType.PERPETUAL_MARKET_TYPE_ISOLATED
                : PerpetualMarketType.PERPETUAL_MARKET_TYPE_CROSS,
          },
          proposal.title,
          proposal.summary,
          MIN_DEPOSIT
        )
      );
      console.log(
        `Tx by wallet ${j} to add market ${marketId} with ticker ${proposal.params.ticker}`,
        tx
      );

      // Record proposed market.
      marketsProposed.set(marketId, proposal);
      proposalIds.push(proposalId);
    }

    // Wait 10 seconds for proposals to be processed.
    await sleep(10000);

    // Vote YES on proposals from every wallet.
    for (const wallet of wallets) {
      retry(() => voteOnProposals(proposalIds, client, wallet));
    }

    // Wait 10 seconds for votes to be processed.
    await sleep(10000);
  }

  // Wait for voting period to end.
  console.log(`\nWaiting for ${VOTING_PERIOD_SECONDS} seconds for voting period to end...`);
  await sleep(VOTING_PERIOD_SECONDS * 1000);

  // Check that no proposal failed.
  console.log('\nChecking that no proposal failed...');
  const proposalsFailed = await client.validatorClient.get.getAllGovProposals(
    ProposalStatus.PROPOSAL_STATUS_FAILED
  );
  if (proposalsFailed.proposals.length > 0) {
    const failedIds = proposalsFailed.proposals.map((proposal) => proposal.id);
    throw new Error(`Proposals ${failedIds} failed: ${proposalsFailed.proposals}`);
  }

  // Wait for prices to update.
  console.log('\nWaiting for 300 seconds for prices to update...');
  await sleep(300 * 1000);

  // Check markets on chain.
  console.log('\nChecking price, clob pair, and perpetual on chain for each market proposed...');
  for (const [marketId, proposal] of marketsProposed.entries()) {
    // Validate price.
    const price = await client.validatorClient.get.getPrice(marketId);
    validatePrice(price.marketPrice!, proposal);

    // Validate clob pair.
    const clobPair = await client.validatorClient.get.getClobPair(marketId);
    validateClobPair(clobPair.clobPair!, proposal);

    // Validate perpetual.
    const perpetual = await client.validatorClient.get.getPerpetual(marketId);
    validatePerpetual(perpetual.perpetual!, proposal);
  }

  console.log(`\nValidated ${marketsProposed.size} proposals against localnet`);
}

function validatePrice(price: MarketPrice, proposal: Proposal): void {
  if (price.exponent !== proposal.params.priceExponent) {
    throw new Error(`Price exponent mismatch for price ${price.id}`);
  }
  if (price.price.isZero()) {
    throw new Error(`Price is 0 for price ${price.id}`);
  }
}

function validateClobPair(clobPair: ClobPair, proposal: Proposal): void {
  if (clobPair.quantumConversionExponent !== proposal.params.quantumConversionExponent) {
    throw new Error(`Quantum conversion exponent mismatch for clob pair ${clobPair.id}`);
  }
  if (!clobPair.stepBaseQuantums.equals(proposal.params.stepBaseQuantums)) {
    throw new Error(`Step base quantums mismatch for clob pair ${clobPair.id}`);
  }
  if (clobPair.subticksPerTick !== proposal.params.subticksPerTick) {
    throw new Error(`Subticks per tick mismatch for clob pair ${clobPair.id}`);
  }
}

function validatePerpetual(perpetual: Perpetual, proposal: Proposal): void {
  if (perpetual.params!.atomicResolution !== proposal.params.atomicResolution) {
    throw new Error(`Atomic resolution mismatch for perpetual ${perpetual.params!.id}`);
  }
  if (perpetual.params!.liquidityTier !== proposal.params.liquidityTier) {
    throw new Error(`Liquidity tier mismatch for perpetual ${perpetual.params!.id}`);
  }
}

function validateParamsSchema(proposal: Proposal): void {
  const ajv = new Ajv();

  const schema = {
    type: 'object',
    properties: {
      id: { type: 'number' },
      ticker: { type: 'string' },
      priceExponent: { type: 'number' },
      minPriceChange: { type: 'number' },
      minExchanges: { type: 'number' },
      exchangeConfigJson: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            exchangeName: { type: 'string' },
            ticker: { type: 'string' },
            adjustByMarket: { type: 'string', nullable: true },
          },
          required: ['exchangeName', 'ticker'],
          additionalProperties: false,
        },
      },
      liquidityTier: { type: 'number' },
      atomicResolution: { type: 'number' },
      quantumConversionExponent: { type: 'number' },
      stepBaseQuantums: { type: 'number' },
      subticksPerTick: { type: 'number' },
      delayBlocks: { type: 'number' },
    },
    required: [
      'id',
      'ticker',
      'priceExponent',
      'minPriceChange',
      'minExchanges',
      'exchangeConfigJson',
      'liquidityTier',
      'atomicResolution',
      'quantumConversionExponent',
      'stepBaseQuantums',
      'subticksPerTick',
      'delayBlocks',
    ],
  };

  const validateParams = ajv.compile(schema);
  validateParams(proposal.params);
  if (validateParams.errors) {
    console.error(validateParams.errors);
    throw new Error(`Json schema validation failed for proposal ${proposal.params.ticker}`);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function retry<T>(
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

async function main(): Promise<void> {
  // Read proposals from json file.
  const fileContent = readFileSync(PATH_TO_PROPOSALS, 'utf8');
  const proposals: Proposal[] = Object.values(JSON.parse(fileContent));

  // Validate JSON schema.
  console.log('Validating JSON schema of params...\n');
  for (const proposal of proposals) {
    validateParamsSchema(proposal);
  }

  // Validate proposal parameters.
  console.log('\nValidating proposal parameters...\n');
  for (const proposal of proposals) {
    // Validate exchange configuration of the market.
    await validateExchangeConfigJson(proposal.params.exchangeConfigJson);
  }

  // Validate proposals against localnet.
  console.log('\nTesting proposals against localnet...\n');
  await validateAgainstLocalnet(proposals);
}

main()
  .then(() => {
    console.log('\nAll proposals validated successfully.');
  })
  .catch((error) => {
    console.error('\nError validating proposals:', error);
    process.exit(1);
  });
