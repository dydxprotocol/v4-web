/* eslint-disable import/no-extraneous-dependencies */

/* eslint-disable no-plusplus */

/* eslint-disable no-console */

/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */
import {
  CompositeClient,
  LocalWallet as LocalWalletType,
  Network,
  ProposalStatus,
} from '@dydxprotocol/v4-client-js';
import { MarketPrice } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/prices/market_price';
import Ajv from 'ajv';
import axios from 'axios';
import { readFileSync } from 'fs';
import { PrometheusDriver } from 'prometheus-query';

import {
  createAndSendMarketMapProposal,
  createAndSendOracleMarketsProposal,
  Exchange,
  ExchangeName,
  Proposal,
  retry,
  sleep,
  voteOnProposals,
} from './help';

const LocalWalletModule = await import(
  '@dydxprotocol/v4-client-js/src/clients/modules/local-wallet'
);
const LocalWallet = LocalWalletModule.default;

const PATH_TO_OLD_PROPOSALS =
  'v4-web-main-other-market-validation/public/configs/otherMarketData.json';
const PATH_TO_PROPOSALS = 'public/configs/otherMarketData.json';
// TODO: Query VOTING_PERIOD_SECONDS from chain.
const VOTING_PERIOD_SECONDS = 60;

const PROMETHEUS_SERVER_URL = 'http://localhost:9091';
const SLINKY_HEALTH_CHECK_WINDOW = '1m';
const PRICE_DISCREPANCY_THRESHOLD = 10; // 10% between highest and lowest reported price

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
  [ExchangeName.Bitfinex]: {
    url: 'https://api-pub.bitfinex.com/v2/conf/pub:list:pair:exchange',
    tickers: null,
    parseResp: (response: any) => {
      return response[0].reduce((acc: Map<string, any>, item: string) => {
        acc.set(item, {});
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
  [ExchangeName.Raydium]: {
    url: '',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.instId, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.UniswapV3_Ethereum]: {
    url: '',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.instId, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.UniswapV3_Base]: {
    url: '',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.instId, {});
        return acc;
      }, new Map<string, any>());
    },
  },
  [ExchangeName.Polymarket]: {
    url: '',
    tickers: null,
    parseResp: (response: any) => {
      return Array.from(response.data).reduce((acc: Map<string, any>, item: any) => {
        acc.set(item.instId, {});
        return acc;
      }, new Map<string, any>());
    },
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
  SLINKY_METRICS_FAILURE = 'Slinky metrics failure',
  PRICE_DISCREPANCY = 'Provider price discrepancy',
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
      (exchange.exchangeName !== ExchangeName.Polymarket &&
        !/usd$|usdc$/i.test(exchange.ticker) &&
        !(exchange.invert && /^usdc/i.test(exchange.ticker)) &&
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

    // TODO: Skip Raydium, Uniswap, and Polymarket since ticker is idiosyncratic
    if (
      exchange.exchangeName === ExchangeName.Raydium ||
      exchange.exchangeName === ExchangeName.UniswapV3_Ethereum ||
      exchange.exchangeName === ExchangeName.UniswapV3_Base ||
      exchange.exchangeName === ExchangeName.Polymarket
    ) {
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
  allTickers.push('USDT-USD');
  const filteredProposals = proposals.filter(
    (proposal) => !allTickers.includes(proposal.params.ticker)
  );

  // Send market map proposal first.
  await createAndSendMarketMapProposal(
    proposals,
    network.validatorConfig.restEndpoint,
    network.validatorConfig.chainId,
    '../v4-chain/protocol/build/dydxprotocold'
  );
  console.log('Submitted market map proposal');

  const numExistingMarkets = allPerps.perpetual.reduce(
    (max, perp) => (perp.params!.id > max ? perp.params!.id : max),
    0
  );

  console.log('Sending oracle markets proposal');

  const marketsProposed = await createAndSendOracleMarketsProposal(
    numExistingMarkets,
    filteredProposals,
    network.validatorConfig.restEndpoint,
    network.validatorConfig.chainId,
    '../v4-chain/protocol/build/dydxprotocold'
  );

  // Wait 5 seconds for proposals to be processed.
  await sleep(5000);
  // Vote YES on proposals from every wallet.
  for (const wallet of wallets) {
    retry(() => voteOnProposals([1, 2], client, wallet));
  }

  // Wait 5 seconds for votes to be processed.
  await sleep(5000);

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
    allErrors.set(
      `Proposal ${proposal.id} with title ${proposal.title}`,
      ValidationError.PROPOSAL_REJECTED
    );
    failedOrRejectedProposals.add(proposal.id);
    console.log(`Proposal ${proposal.id} with title ${proposal.title} was rejected`);
  });

  // Check which proposals failed.
  console.log('\nChecking which proposals failed...');
  const proposalsFailed = await client.validatorClient.get.getAllGovProposals(
    ProposalStatus.PROPOSAL_STATUS_FAILED
  );
  console.log(`${proposalsFailed.proposals.length} proposals failed`);
  proposalsFailed.proposals.map((proposal) => {
    allErrors.set(
      `Proposal ${proposal.id} with title ${proposal.title}`,
      ValidationError.PROPOSAL_FAILED
    );
    failedOrRejectedProposals.add(proposal.id);
    console.log(
      `Proposal ${proposal.id} with title ${proposal.title} failed due to: ${proposal.failedReason}`
    );
  });

  // Wait for prices to update.
  console.log('\nWaiting for 300 seconds for prices to update...');
  await sleep(300 * 1000);

  // Check markets on chain.
  console.log('\nChecking price, clob pair, and perpetual on chain for each market proposed...');
  for (const [marketId, ticker] of marketsProposed.entries()) {
    const isDydxUsd = ticker.toLowerCase() === 'dydx-usd';
    // Validate price.
    const price = await client.validatorClient.get.getPrice(isDydxUsd ? 1000001 : marketId);
    validatePrice(price.marketPrice!, ticker, allErrors);
  }

  // for all markets proposed, determine if the slinky metrics are ok
  for (const proposal of proposals) {
    const slinkyTicker = dydxTickerToSlinkyTicker(proposal.params.ticker);
    await checkPriceDiscrepancies(slinkyTicker, allErrors);
    for (const exchange of proposal.params.exchangeConfigJson) {
      await validateSlinkyMetricsPerTicker(
        slinkyTicker,
        exchange.ticker.toLowerCase(),
        exchange.exchangeName,
        allErrors
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

async function checkPriceDiscrepancies(
  ticker: string,
  allErrors: Map<String, ValidationError>
): Promise<void> {
  const prometheus = new PrometheusDriver({
    endpoint: PROMETHEUS_SERVER_URL,
    baseURL: '/api/v1',
  });
  const providerPricesQuery = `(side_car_provider_price{id="${ticker}"})`;
  const response = await prometheus.instantQuery(providerPricesQuery);
  const prices = [];
  const providerPriceMap = new Map<string, number>();
  for (const result of response.result) {
    const price = result.value.value;
    prices.push(price);
    providerPriceMap.set(result.metric.labels.provider, price);
  }

  if (prices.length < 2) return; // Skip if there's only one price

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const percentDifference = ((maxPrice - minPrice) / minPrice) * 100;
  if (percentDifference > PRICE_DISCREPANCY_THRESHOLD) {
    allErrors.set(
      `Price discrepancy above ${PRICE_DISCREPANCY_THRESHOLD}% for ${ticker}: ${JSON.stringify(Object.fromEntries(providerPriceMap), null, 2)}}`,
      ValidationError.PRICE_DISCREPANCY
    );
  }
}

async function validateSlinkyMetricsPerTicker(
  ticker: string,
  exchangeSpecificTicker: string,
  exchange: string,
  allErrors: Map<String, ValidationError>
): Promise<void> {
  const prometheus = new PrometheusDriver({
    endpoint: PROMETHEUS_SERVER_URL,
    baseURL: '/api/v1',
  });

  const exchangeAPIQuerySuccessRate = `(
    sum(rate(side_car_provider_status_responses_per_id{status = "success", provider="${exchange}", id="${exchangeSpecificTicker}"}[${SLINKY_HEALTH_CHECK_WINDOW}])) by (provider, id)
 ) / 
 (
    sum(rate(side_car_provider_status_responses_per_id{provider="${exchange}", id="${exchangeSpecificTicker}"}[${SLINKY_HEALTH_CHECK_WINDOW}])) by (provider, id)
 )`;

  const slinkyPriceAggregationQuery = `(
    sum(rate(side_car_health_check_ticker_updates_total{id="${ticker}"}[${SLINKY_HEALTH_CHECK_WINDOW}])) by (instance, job)
    /
    sum(rate(side_car_health_check_system_updates_total[${SLINKY_HEALTH_CHECK_WINDOW}])) by (instance, job)
)`;

  const slinkyProviderPricesQuery = `sum(rate(side_car_health_check_provider_updates_total{provider="${exchange}", id="${ticker}", success='true'}[${SLINKY_HEALTH_CHECK_WINDOW}])) by (provider, id)
  /
  sum(rate(side_car_health_check_provider_updates_total{provider="${exchange}", id="${ticker}"}[${SLINKY_HEALTH_CHECK_WINDOW}])) by (provider, id)`;

  async function handlePrometheusRateQuery(query: string, threshold: number): Promise<void> {
    try {
      await makePrometheusRateQuery(prometheus, query, threshold);
    } catch (error) {
      allErrors.set(`${exchange} and ${ticker}: ${error}`, ValidationError.SLINKY_METRICS_FAILURE);
    }
  }
  // determine success-rate for slinky queries to each exchange
  await handlePrometheusRateQuery(exchangeAPIQuerySuccessRate, 0.7);

  // determine success rate for slinky price aggregation per market
  await handlePrometheusRateQuery(slinkyPriceAggregationQuery, 0.7);

  // determine success rate for slinky price provider per market
  await handlePrometheusRateQuery(slinkyProviderPricesQuery, 0.7);
}

async function makePrometheusRateQuery(
  prometheus: PrometheusDriver,
  query: string,
  threshold: number
): Promise<void> {
  const response = await prometheus.instantQuery(query);
  const result = response.result[0].value.value;
  if (result < threshold) {
    throw new Error(
      `slinky metric value ${result} for ${query} is below success rate threshold ${threshold}`
    );
  }
}

function validatePrice(
  price: MarketPrice,
  ticker: string,
  allErrors: Map<String, ValidationError>
): void {
  if (price.price.isZero()) {
    allErrors.set(`Price ${price.id.toString()} with ticker ${ticker}`, ValidationError.PRICE_ZERO);
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
            invert: { type: 'boolean', nullable: true },
            metadata_JSON: { type: 'string', nullable: true },
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

    const oldParams = removeIdFromParams(oldProposals[name]!.params);
    const newParams = removeIdFromParams(newProposal.params);
    if (JSON.stringify(oldParams) !== JSON.stringify(newParams)) {
      marketsToValidate.add(name);
    }
  }

  return marketsToValidate;
}

function removeIdFromParams(params: any): any {
  const { id, ...paramsWithoutId } = params;
  return paramsWithoutId;
}

async function main(): Promise<void> {
  // Read new proposals.
  const newProposals: Record<string, Proposal> = JSON.parse(
    readFileSync(PATH_TO_PROPOSALS, 'utf8')
  );

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

  await validateAgainstLocalnet(Array.from(proposalsToValidate).map((name) => newProposals[name]!));

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
