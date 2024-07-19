/* eslint-disable import/no-extraneous-dependencies */

/* eslint-disable no-plusplus */

/* eslint-disable no-console */

/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */
import { StdFee } from '@cosmjs/stargate';
import {
  CompositeClient,
  LocalWallet as LocalWalletType,
  Network,
  ProposalStatus
} from '@dydxprotocol/v4-client-js';
import {
  Perpetual,
  PerpetualMarketType,
} from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/dydxprotocol/perpetuals/perpetual';
import { ClobPair } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/clob/clob_pair';
import { MarketPrice } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/prices/market_price';
import Ajv from 'ajv';
import axios from 'axios';
import { readFileSync } from 'fs';
import Long from 'long';
import { PrometheusDriver } from 'prometheus-query';

import { Exchange, ExchangeName, Proposal, retry, sleep, voteOnProposals } from './help';

const LocalWalletModule = await import(
  '@dydxprotocol/v4-client-js/src/clients/modules/local-wallet'
);
const LocalWallet = LocalWalletModule.default;

const PATH_TO_OLD_PROPOSALS = 'v4-web-main-other-market-validation/public/configs/otherMarketData.json';
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

const PROMETHEUS_SERVER_URL = 'http://localhost:9091';

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

interface PrometheusTimeSeries {
  // value of the time serie
  value: number;
}

interface ExchangeInfo {
  url: string;
  tickers: Map<string, any> | null;
  parseResp: (response: any) => Map<string, any>;
  slinkyProviderName: string;
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
    slinkyProviderName: 'binance_api',
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
    slinkyProviderName: 'binance_api',
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
    slinkyProviderName: 'bitfinex_ws',
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
    slinkyProviderName: 'bitstamp_ws',
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
    slinkyProviderName: 'bybit_ws',
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
    slinkyProviderName: 'coinbase_api',
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
    slinkyProviderName: 'crypto_dot_com_ws',
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
    slinkyProviderName: 'gate_ws',
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
    slinkyProviderName: 'huobi_ws',
  },
  [ExchangeName.Kraken]: {
    url: 'https://api.kraken.com/0/public/Ticker',
    tickers: null,
    parseResp: (response: any) => {
      return new Map<string, any>(Object.entries(response.result));
    },
    slinkyProviderName: 'kraken_api',
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
    slinkyProviderName: 'kucoin_ws',
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
    slinkyProviderName: 'mexc_ws',
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
    slinkyProviderName: 'okx_ws',
  },
  [ExchangeName.Raydium]: {
    url: '',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.instId, {});
        return acc;
      }, new Map<string, any>());
    },
    slinkyProviderName: 'Raydium',
  },
};

enum ValidationError {
  PROPOSAL_REJECTED = 'proposal rejected',
  PROPOSAL_FAILED = 'proposal failed',
  PRICE_EXPONENT_MISMATCH = 'price exponent mismatch',
  PRICE_ZERO = 'price is 0',
  CLOB_QCE_MISMATCH = 'Quantum conversion exponent mismatch',
  CLOB_SBQ_MISMATCH = 'step base quantums mismatch',
  CLOB_SPT_MISMATCH = 'subticks per tick mismatch',
  PERP_AR_MISMATCH = 'Atomic resolution mismatch',
  PERP_LT_MISMATCH = 'Liquidity tier mismatch',
}

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
      (exchange.exchangeName !== ExchangeName.Raydium &&
        !/usd$|usdc$/i.test(exchange.ticker) &&
        exchange.adjustByMarket === undefined) ||
      exchange.adjustByMarket === ''
    ) {
      throw new Error(
        `adjustByMarket is not set for ticker ${exchange.ticker} on exchange ${exchange.exchangeName}`
      );
    }
    const { url, tickers, parseResp } = EXCHANGE_INFO[exchange.exchangeName];

    // TODO: Skip Bybit exchange until we can query from non-US IP.
    if (exchange.exchangeName === ExchangeName.Bybit) {
      continue; // exit the current iteration of the loop.
    }

    // TODO: Skip Raydium since ticker is idiosyncratic
    if (exchange.exchangeName === ExchangeName.Raydium) {
      continue; // exit the current iteration of the loop.
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
          // @ts-ignore: marketType is not a valid parameter for addNewMarketProposal
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

    // Wait 5 seconds for proposals to be processed.
    await sleep(5000);

    // Vote YES on proposals from every wallet.
    for (const wallet of wallets) {
      retry(() => voteOnProposals(proposalIds, client, wallet));
    }

    // Wait 5 seconds for votes to be processed.
    await sleep(5000);
  }

  // Wait for voting period to end.
  console.log(`\nWaiting for ${VOTING_PERIOD_SECONDS} seconds for voting period to end...`);
  await sleep(VOTING_PERIOD_SECONDS * 1000);

  // Keep track of which error occurred for which markets.
  const allErrors: Map<string, ValidationError> = new Map();
  const failedOrRejectedProposals = new Set<Long.Long>();

  // Check which proposals were rejected.
  console.log('\nChecking which proposals were rejected...');
  const proposalsRejected = await client.validatorClient.get.getAllGovProposals(
    ProposalStatus.PROPOSAL_STATUS_REJECTED
  );
  console.log(`${proposalsRejected.proposals.length} proposals rejected`);
  proposalsRejected.proposals.map((proposal) => {
    allErrors.set(`Proposal ${proposal.id} with title ${proposal.title}`, ValidationError.PROPOSAL_REJECTED);
    failedOrRejectedProposals.add(proposal.id);
  })

  // Check which proposals failed.
  console.log('\nChecking which proposals failed...');
  const proposalsFailed = await client.validatorClient.get.getAllGovProposals(
    ProposalStatus.PROPOSAL_STATUS_FAILED
  );
  console.log(`${proposalsFailed.proposals.length} proposals failed`);
  proposalsFailed.proposals.map((proposal) => {
    allErrors.set(`Proposal ${proposal.id} with title ${proposal.title}`, ValidationError.PROPOSAL_FAILED);
    failedOrRejectedProposals.add(proposal.id);
  })

  // Wait for prices to update.
  console.log('\nWaiting for 300 seconds for prices to update...');
  await sleep(400 * 1000);

  // Check markets on chain.
  console.log('\nChecking price, clob pair, and perpetual on chain for each market proposed...');
  for (const [marketId, proposal] of marketsProposed.entries()) {
    console.log(`\nChecking ${proposal?.params?.ticker}`);
    if (failedOrRejectedProposals.has(proposal.id)) {
      console.log(`Skipping proposal ${proposal.id} as it failed or was rejected.`);
      continue;
    }

    const isDydxUsd = proposal.params.ticker.toLowerCase() === 'dydx-usd';
    // Validate price.
    const price = await client.validatorClient.get.getPrice(isDydxUsd ? 1000001 : marketId);
    validatePrice(price.marketPrice!, proposal, allErrors);

    // Validate clob pair.
    const clobPair = await client.validatorClient.get.getClobPair(marketId);
    validateClobPair(clobPair.clobPair!, proposal, allErrors);

    // Validate perpetual.
    const perpetual = await client.validatorClient.get.getPerpetual(marketId);
    validatePerpetual(perpetual.perpetual!, proposal, allErrors);
  }

  // for all markets proposed, determine if the slinky metrics are ok
  for (const proposal of marketsProposed.values()) {
    for (const exchange of proposal.params.exchangeConfigJson) {
      validateSlinkyMetricsPerTicker(
        dydxTickerToSlinkyTicker(proposal.params.ticker),
        exchange.ticker.toLowerCase(),
        EXCHANGE_INFO[exchange.exchangeName].slinkyProviderName
      );
    }
  }

  // Print all errors.
  console.log(`\nValidated ${marketsProposed.size} markets against localnet`);
  if (allErrors.size === 0) {
    console.log('All markets validated successfully');
    return;
  }
  console.log(`\nPrinting out ${allErrors.size} errors:`);
  allErrors.forEach((k, v) => {
    console.log(`${k}: ${v}`);
  });
  throw new Error('Errors occurred while validating markets');
}

// convert a ticker like BTC-USD -> btc/usd
function dydxTickerToSlinkyTicker(ticker: string): string {
  return ticker.toLowerCase().replace('-', '/');
}

function validateSlinkyMetricsPerTicker(
  ticker: string,
  exchangeSpecificTicker: string,
  exchange: string
): void {
  const prometheus = new PrometheusDriver({
    endpoint: PROMETHEUS_SERVER_URL,
    baseURL: '/api/v1',
  });

  const exchangeAPIQuerySuccessRate = `(
    sum(rate(side_car_provider_status_responses_per_id{status = "success", provider="${exchange}", id="${exchangeSpecificTicker}"}[1m])) by (provider, id)
 ) / 
 (
    sum(rate(side_car_provider_status_responses_per_id{provider="${exchange}", id="${exchangeSpecificTicker}"}[1m])) by (provider, id)
 )`;

  const slinkyPriceAggregationQuery = `(
    sum(rate(side_car_health_check_ticker_updates_total{id="${ticker}"}[1m])) by (instance, job)
    /
    sum(rate(side_car_health_check_system_updates_total[1m])) by (instance, job)
)`;

  const slinkyProviderPricesQuery = `sum(rate(side_car_health_check_provider_updates_total{provider="${exchange}", id="${ticker}", success='true'}[1m])) by (provider, id)
  /
  sum(rate(side_car_health_check_provider_updates_total{provider="${exchange}", id="${ticker}"}[1m])) by (provider, id)`;

  const start = new Date().getTime() - 3 * 60 * 1000;
  const end = new Date().getTime();
  const step = 60;

  // determine success-rate for slinky queries to each exchange
  makePrometheusRateQuery(prometheus, exchangeAPIQuerySuccessRate, start, end, step, 0.7);

  // determine success rate for slinky price aggregation per market
  makePrometheusRateQuery(prometheus, slinkyPriceAggregationQuery, start, end, step, 0.7);

  // determine success rate for slinky price provider per market
  makePrometheusRateQuery(prometheus, slinkyProviderPricesQuery, start, end, step, 0.7);
}

function makePrometheusRateQuery(
  prometheus: PrometheusDriver,
  query: string,
  start: number,
  end: number,
  step: number,
  threshold: number
): void {
  prometheus
    .rangeQuery(query, start, end, step)
    .then((response) => {
      const series = response.result;
      series.forEach((s) => {
        const values = s.values;
        let totalSuccessRate = 0;
        values.forEach((v: PrometheusTimeSeries) => {
          // take the average of all success-rates over the interval
          if (!Number.isNaN(v.value)) {
            // we see NaN when there have been no successes from the provider
            totalSuccessRate += v.value;
          }
        });
        if (values.length === 0 || totalSuccessRate / values.length < threshold) {
          throw new Error(
            `slinky metrics for ${query} is below success rate threshold ${threshold}: ${
              totalSuccessRate / values.length
            }`
          );
        }
      });
    })
    .catch((error) => {
      throw error;
    });
}

function validatePrice(price: MarketPrice, proposal: Proposal, allErrors: Map<String, ValidationError>): void {
  const ticker = proposal?.params?.ticker;
  if (price.exponent !== proposal.params.priceExponent) {
    allErrors.set(`Price ${price.id.toString()} with ticker ${ticker}`, ValidationError.PRICE_EXPONENT_MISMATCH);
  }
  if (price.price.isZero()) {
    allErrors.set(`Price ${price.id.toString()} with ticker ${ticker}`, ValidationError.PRICE_ZERO);
  }
}

function validateClobPair(clobPair: ClobPair, proposal: Proposal, allErrors: Map<String, ValidationError>): void {
  const ticker = proposal?.params?.ticker;
  if (clobPair.quantumConversionExponent !== proposal.params.quantumConversionExponent) {
    allErrors.set(`Clob pair ${clobPair.id.toString()} with ticker ${ticker}`, ValidationError.CLOB_QCE_MISMATCH);
  }
  if (!clobPair.stepBaseQuantums.equals(proposal.params.stepBaseQuantums)) {
    allErrors.set(`Clob pair ${clobPair.id.toString()} with ticker ${ticker}`, ValidationError.CLOB_SBQ_MISMATCH);
  }
  if (clobPair.subticksPerTick !== proposal.params.subticksPerTick) {
    allErrors.set(`Clob pair ${clobPair.id.toString()} with ticker ${ticker}`, ValidationError.CLOB_SPT_MISMATCH);
  }
}

function validatePerpetual(perpetual: Perpetual, proposal: Proposal, allErrors: Map<String, ValidationError>): void {
  const ticker = proposal?.params?.ticker;
  if (perpetual.params!.atomicResolution !== proposal.params.atomicResolution) {
    allErrors.set(`Perpetual ${perpetual.params!.id.toString()} with ticker ${ticker}`, ValidationError.PERP_AR_MISMATCH);
  }
  if (perpetual.params!.liquidityTier !== proposal.params.liquidityTier) {
    allErrors.set(`Perpetual ${perpetual.params!.id.toString()} with ticker ${ticker}`, ValidationError.PERP_LT_MISMATCH);
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
            invert: {type: 'boolean', nullable: true },
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

// getProposalsToValidate finds proposals that are either added or whose params are modified,
// i.e. ignoring initialDeposit, meta, summary, title, etc.
function getProposalsToValidate(newProposals: Record<string, Proposal>): Set<string> {
  const oldProposals: Record<string, Proposal> = JSON.parse(
    readFileSync(PATH_TO_OLD_PROPOSALS, 'utf8')
  );

  const marketsToValidate = new Set<string>();

  for (const [name, newProposal] of Object.entries(newProposals)) {
    if (!(name in oldProposals)) {
      marketsToValidate.add(name);
      continue;
    }

    if (JSON.stringify(oldProposals[name].params) !== JSON.stringify(newProposal.params)) {
      marketsToValidate.add(name);
    }
  }

  return marketsToValidate;
}
function getAllMarketsToValidate(otherMarketsContent: string): Set<string> {
  // Create a set to store all markets
  const marketsToValidate = new Set<string>();

  // Split the content by lines
  const lines = otherMarketsContent.split('\n');

  // Regex to find market lines
  const marketRegex = /"([A-Z]+)": \{/;

  // Iterate over each line to find all markets
  lines.forEach(line => {
    const match = line.trim().match(marketRegex);
    if (match) {
      marketsToValidate.add(match[1]);
    }
  });

  // Log a message if no markets were found
  if (marketsToValidate.size === 0) {
    console.log('No markets to validate');
  }

  return marketsToValidate;
}


async function main(): Promise<void> {
  // Read new proposals.
  const newProposals: Record<string, Proposal> = JSON.parse(readFileSync(PATH_TO_PROPOSALS, 'utf8'));

  // Validate JSON schema of all proposals.
  console.log('Validating JSON schema of all proposals...\n');
  for (const proposal of Object.values(newProposals)) {
    validateParamsSchema(proposal);
  }

  // Validate parameters of all proposals.
  console.log('\nValidating parameters of all proposals...\n');
  for (const proposal of Object.values(newProposals)) {
    // Validate exchange configuration of the market.
    await validateExchangeConfigJson(proposal.params.exchangeConfigJson);
  }

  // Validate added/modified proposals against localnet.
  const proposalsToValidate = getProposalsToValidate(newProposals);
  console.log('\nTesting added/modified proposals against localnet...\n', proposalsToValidate);
  if (proposalsToValidate.size === 0) {
    return;
  }
  await validateAgainstLocalnet(
    Array.from(proposalsToValidate).map((name) => newProposals[name])
  );

  console.log(`\nValidated ${proposalsToValidate.size} proposals. See log for specific names.`);
}

main()
  .then(() => {
    console.log('\nAll proposals validated successfully.');
  })
  .catch((error) => {
    console.error('\nError validating proposals:', error);
    process.exit(1);
  });
