/*
This script adds markets to a dYdX chain. Markets are read from public/config/otherMarketData.json.

Supported environments: local, dev, dev2, dev3, dev4, dev5, staging.

Usage:
  $ pnpx tsx scripts/markets/add-markets.ts <environment> <number_of_markets>
Example (add 10 markets on staging):
  $ pnpx tsx scripts/markets/add-markets.ts staging 10
*/
import {
  CompositeClient,
  IndexerConfig,
  LocalWallet as LocalWalletType,
  Network,
  ValidatorConfig,
} from '@dydxprotocol/v4-client-js';
import { PerpetualMarketType } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/perpetuals/perpetual';
import { readFileSync } from 'fs';
import Long from 'long';

import { Proposal, retry, sleep, voteOnProposals } from './help';

const LocalWalletModule = await import(
  '@dydxprotocol/v4-client-js/src/clients/modules/local-wallet'
);
const LocalWallet = LocalWalletModule.default;

// TODO: Query MIN_DEPOSIT from chain.
const MIN_DEPOSIT = '10000000';
// Markets become active `DELAY_BLOCKS` blocks after markets are added.
const DELAY_BLOCKS: number = 100;

const MNEMONICS = [
  // alice
  'merge panther lobster crazy road hollow amused security before critic about cliff exhibit cause coyote talent happy where lion river tobacco option coconut small',

  // bob
  'color habit donor nurse dinosaur stable wonder process post perfect raven gold census inside worth inquiry mammal panic olive toss shadow strong name drum',

  // carl
  'school artefact ghost shop exchange slender letter debris dose window alarm hurt whale tiger find found island what engine ketchup globe obtain glory manage',

  // dave
  'switch boring kiss cash lizard coconut romance hurry sniff bus accident zone chest height merit elevator furnace eagle fetch quit toward steak mystery nest',

  // emily
  'brave way sting spin fog process matrix glimpse volcano recall day lab raccoon hand path pig rent mixture just way blouse alone upon prefer',

  // fiona
  'suffer claw truly wife simple mean still mammal bind cake truly runway attack burden lazy peanut unusual such shock twice appear gloom priority kind',

  // greg
  'step vital slight present group gallery flower gap copy sweet travel bitter arena reject evidence deal ankle motion dismiss trim armed slab life future',

  // henry
  'piece choice region bike tragic error drive defense air venture bean solve income upset physical sun link actor task runway match gauge brand march',

  // ian
  'burst section toss rotate law thumb shoe wire only decide meadow aunt flight humble story mammal radar scene wrist essay taxi leisure excess milk',

  // jeff
  'fashion charge estate devote jaguar fun swift always road lend scrap panic matter core defense high gas athlete permit crane assume pact fitness matrix',
];

enum Env {
  LOCAL = 'local',
  DEV = 'dev',
  DEV2 = 'dev2',
  DEV3 = 'dev3',
  DEV4 = 'dev4',
  DEV5 = 'dev5',
  STAGING = 'staging',
}

const ENV_CONFIG = {
  [Env.LOCAL]: {
    chainId: 'localdydxprotocol',
    blockTimeSeconds: 5,
    numValidators: 4,
    validatorEndpoint: 'http://localhost:26657',
    indexerRestEndpoint: '',
    indexerWsEndpoint: '',
  },
  [Env.DEV]: {
    chainId: 'dydxprotocol-testnet',
    blockTimeSeconds: 1,
    numValidators: 4,
    validatorEndpoint: 'http://3.134.210.83:26657',
    indexerRestEndpoint: 'https://indexer.v4dev.dydx.exchange',
    indexerWsEndpoint: 'wss://indexer.v4dev.dydx.exchange',
  },
  [Env.DEV2]: {
    chainId: 'dydxprotocol-testnet',
    blockTimeSeconds: 1,
    numValidators: 4,
    validatorEndpoint: 'http://18.220.125.195:26657',
    indexerRestEndpoint: '',
    indexerWsEndpoint: '',
  },
  [Env.DEV3]: {
    chainId: 'dydxprotocol-testnet',
    blockTimeSeconds: 1,
    numValidators: 4,
    validatorEndpoint: 'http://3.21.4.182:26657',
    indexerRestEndpoint: '',
    indexerWsEndpoint: '',
  },
  [Env.DEV4]: {
    chainId: 'dydxprotocol-testnet',
    blockTimeSeconds: 1,
    numValidators: 4,
    validatorEndpoint: 'http://3.23.254.51:26657',
    indexerRestEndpoint: '',
    indexerWsEndpoint: '',
  },
  [Env.DEV5]: {
    chainId: 'dydxprotocol-testnet',
    blockTimeSeconds: 1,
    numValidators: 4,
    validatorEndpoint: 'http://18.223.78.50:26657',
    indexerRestEndpoint: '',
    indexerWsEndpoint: '',
  },
  [Env.STAGING]: {
    chainId: 'dydxprotocol-testnet',
    blockTimeSeconds: 1,
    numValidators: 10,
    validatorEndpoint: 'http://18.188.95.153:26657',
    indexerRestEndpoint: 'https://indexer.v4staging.dydx.exchange',
    indexerWsEndpoint: 'wss://indexer.v4staging.dydx.exchange',
  },
};

async function addMarkets(env: Env, numMarkets: number, proposals: Proposal[]): Promise<void> {
  // Initialize client and wallets.
  const config = ENV_CONFIG[env];
  const indexerConfig = new IndexerConfig(config.indexerRestEndpoint, config.indexerWsEndpoint);
  const validatorConfig = new ValidatorConfig(
    config.validatorEndpoint,
    config.chainId,
    {
      CHAINTOKEN_DENOM: 'adv4tnt',
      USDC_DENOM: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
      USDC_GAS_DENOM: 'uusdc',
      USDC_DECIMALS: 6,
      CHAINTOKEN_DECIMALS: 18,
    },
    undefined,
    'Client Example'
  );
  const network = new Network(env, indexerConfig, validatorConfig);

  const client = await CompositeClient.connect(network);
  const wallets: LocalWalletType[] = await Promise.all(
    MNEMONICS.slice(0, config.numValidators).map((mnemonic) => {
      return LocalWallet.fromMnemonic(mnemonic, 'dydx');
    })
  );

  // Send proposals to add all markets (skip markets that already exist).
  const allPerps = await client.validatorClient.get.getAllPerpetuals();
  const allTickers = allPerps.perpetual.map((perp) => perp.params!.ticker);
  const filteredProposals = proposals.filter(
    (proposal) => !allTickers.includes(proposal.params.ticker)
  );

  console.log(`Adding ${numMarkets} new markets to ${env}...`);

  const sleepMsBtwTxs = 3.5 * config.blockTimeSeconds * 1000;
  let numProposalsToSend = Math.min(numMarkets, filteredProposals.length);
  let numProposalsSent = 0;
  const numExistingMarkets = allPerps.perpetual.reduce(
    (max, perp) => (perp.params!.id > max ? perp.params!.id : max),
    0
  );

  for (let i = 0; i < numProposalsToSend; i += config.numValidators) {
    // Send out proposals in groups.
    const proposalsToSend = filteredProposals.slice(i, i + config.numValidators);
    const proposalIds: number[] = [];
    for (let j = 0; j < proposalsToSend.length; j++) {
      if (numProposalsSent >= numProposalsToSend) {
        break;
      }
      const proposal = proposalsToSend[j];
      const proposalId: number = i + j + 1;
      const marketId: number = numExistingMarkets + proposalId;

      // Send proposal.
      const exchangeConfigString = `{"exchanges":${JSON.stringify(
        proposal.params.exchangeConfigJson
      )}}`;
      await retry(() =>
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
            delayBlocks: DELAY_BLOCKS,
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
      console.log(`Proposed market ${marketId} with ticker ${proposal.params.ticker}`);

      // Record proposed market.
      proposalIds.push(proposalId);
      numProposalsSent++;
    }

    // Wait for proposals to be processed.
    await sleep(sleepMsBtwTxs);

    // Vote YES on proposals from every wallet.
    for (const wallet of wallets) {
      retry(() => voteOnProposals(proposalIds, client, wallet));
    }

    // Wait for votes to be processed.
    await sleep(sleepMsBtwTxs);
  }
}

async function main(): Promise<void> {
  // Get which env and how many markets to add.
  const args = process.argv.slice(2);
  const env = args[0] as Env;
  const numMarkets = parseInt(args[1], 10);

  // Validate inputs.
  if (!Object.values(Env).includes(env)) {
    throw new Error(`Invalid environment: ${env}`);
  } else if (isNaN(numMarkets) || numMarkets <= 0) {
    throw new Error(`Invalid number of markets: ${numMarkets}`);
  }

  // Read proposals.
  const proposals: Record<string, Proposal> = JSON.parse(
    readFileSync('public/configs/otherMarketData.json', 'utf8')
  );

  // Add markets.
  await addMarkets(env, numMarkets, Object.values(proposals));
}

main()
  .then(() => {
    console.log('\nDone');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
