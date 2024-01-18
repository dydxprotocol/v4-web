import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BECH32_PREFIX,
  CompositeClient,
  FaucetClient,
  IndexerConfig,
  LocalWallet,
  onboarding,
  Network,
  ValidatorConfig,
} from '@dydxprotocol/v4-client-js';

// import { Any } from 'cosmjs-types/google/protobuf/any';
import * as govtx from '@dydxprotocol/v4-proto/src/codegen/cosmos/gov/v1/tx';
import * as pricetx from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/prices/tx';
import * as perptx from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/perpetuals/tx';
import * as clobtx from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/clob/tx';
import * as clobpair from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/clob/clob_pair';
import * as delaytx from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/delaymsg/tx';
import { Coin } from '@dydxprotocol/v4-proto/src/codegen/cosmos/base/v1beta1/coin';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { GeneratedType, Registry, EncodeObject } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import {
  MsgPlaceOrder,
  MsgCancelOrder,
  MsgCreateClobPair,
  MsgUpdateClobPair,
} from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/clob/tx';
import { MsgDelayMessage } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/delaymsg/tx';
import { MsgCreatePerpetual } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/perpetuals/tx';
import { MsgCreateOracleMarket } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/prices/tx';
import {
  MsgWithdrawFromSubaccount,
  MsgDepositToSubaccount,
} from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/sending/transfer';
import {
  MsgCreateTransfer,
} from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/sending/tx';

import type { ResolutionString } from 'public/tradingview/charting_library';

import type { ConnectNetworkEvent, NetworkConfig } from '@/constants/abacus';
import { type Candle, RESOLUTION_MAP } from '@/constants/candles';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { DydxChainAsset } from '@/constants/wallets';

import { getSelectedNetwork } from '@/state/appSelectors';

import { log } from '@/lib/telemetry';

import { useRestrictions } from './useRestrictions';

type DydxContextType = ReturnType<typeof useDydxClientContext>;
const DydxContext = createContext<DydxContextType>({} as DydxContextType);
DydxContext.displayName = 'dYdXClient';

export const DydxProvider = ({ ...props }) => (
  <DydxContext.Provider value={useDydxClientContext()} {...props} />
);

export const useDydxClient = () => useContext(DydxContext);

const useDydxClientContext = () => {
  // ------ Network ------ //

  const selectedNetwork = useSelector(getSelectedNetwork);
  const tokensConfigs = ENVIRONMENT_CONFIG_MAP[selectedNetwork].tokens;

  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>();

  useEffect(() => {
    const onConnectNetwork = (event: ConnectNetworkEvent) => setNetworkConfig(event.detail);

    globalThis.addEventListener('abacus:connectNetwork', onConnectNetwork);

    return () => globalThis.removeEventListener('abacus:connectNetwork', onConnectNetwork);
  }, []);

  // ------ Client Initialization ------ //

  const [compositeClient, setCompositeClient] = useState<CompositeClient>();
  const [faucetClient, setFaucetClient] = useState<FaucetClient>();

  useEffect(() => {
    (async () => {
      if (
        networkConfig?.chainId &&
        networkConfig?.indexerUrl &&
        networkConfig?.websocketUrl &&
        networkConfig?.validatorUrl
      ) {
        try {
          const initializedClient = await CompositeClient.connect(
            new Network(
              selectedNetwork,
              new IndexerConfig(networkConfig.indexerUrl, networkConfig.websocketUrl),
              new ValidatorConfig(networkConfig.validatorUrl, networkConfig.chainId,
                {
                  USDC_DENOM: tokensConfigs[DydxChainAsset.USDC].denom,
                  USDC_DECIMALS: tokensConfigs[DydxChainAsset.USDC].decimals,
                  USDC_GAS_DENOM: tokensConfigs[DydxChainAsset.USDC].gasDenom,
                  CHAINTOKEN_DENOM: tokensConfigs[DydxChainAsset.CHAINTOKEN].denom,
                  CHAINTOKEN_DECIMALS: tokensConfigs[DydxChainAsset.CHAINTOKEN].decimals,
                }, {
                broadcastPollIntervalMs: 3_000,
                broadcastTimeoutMs: 60_000,
              })
            )
          );
          setCompositeClient(initializedClient);
        } catch (error) {
          log('useDydxClient/initializeCompositeClient', error);
        }
      } else {
        setCompositeClient(undefined);
      }

      if (networkConfig?.faucetUrl) {
        setFaucetClient(new FaucetClient(networkConfig.faucetUrl));
      } else {
        setFaucetClient(undefined);
      }
    })();
  }, [networkConfig]);

  // ------ Wallet Methods ------ //
  const getWalletFromEvmSignature = async ({ signature }: { signature: string }) => {
    const { mnemonic, privateKey, publicKey } =
      onboarding.deriveHDKeyFromEthereumSignature(signature);

    return {
      wallet: await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX),
      mnemonic,
      privateKey,
      publicKey,
    };
  };

  // ------ Public Methods ------ //
  const requestCandles = useCallback(
    async ({
      marketId,
      marketType = 'perpetualMarkets',
      resolution,
      fromIso,
      toIso,
    }: {
      marketId: string;
      marketType?: string;
      resolution: ResolutionString;
      fromIso?: string;
      toIso?: string;
    }): Promise<Candle[]> => {
      try {
        const { candles } =
          (await compositeClient?.indexerClient.markets.getPerpetualMarketCandles(
            marketId,
            RESOLUTION_MAP[resolution],
            fromIso,
            toIso
          )) || {};
        return candles || [];
      } catch (error) {
        log('useDydxClient/getPerpetualMarketCandles', error);
        return [];
      }
    },
    [compositeClient]
  );

  const getCandlesForDatafeed = useCallback(
    async ({
      marketId,
      resolution,
      fromMs,
      toMs,
    }: {
      marketId: string;
      resolution: ResolutionString;
      fromMs: number;
      toMs: number;
    }) => {
      const fromIso = new Date(fromMs).toISOString();
      let toIso = new Date(toMs).toISOString();
      const candlesInRange: Candle[] = [];

      while (true) {
        const candles = await requestCandles({
          marketId,
          resolution,
          fromIso,
          toIso,
        });

        if (!candles || candles.length === 0) {
          break;
        }

        candlesInRange.push(...candles);
        const length = candlesInRange.length;

        if (length) {
          const oldestTime = new Date(candlesInRange[length - 1].startedAt).getTime();

          if (oldestTime > fromMs) {
            toIso = candlesInRange[length - 1].startedAt;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return candlesInRange;
    },
    [requestCandles]
  );

  const { updateSanctionedAddresses } = useRestrictions();

  const screenAddresses = useCallback(
    async ({ addresses }: { addresses: string[] }) => {
      if (compositeClient) {
        const promises = addresses.map((address) =>
          compositeClient.indexerClient.utility.screen(address)
        );

        const results = await Promise.all(promises);

        const screenedAddresses = Object.fromEntries(
          addresses.map((address, index) => [address, results[index]?.restricted])
        );

        updateSanctionedAddresses(screenedAddresses);
        return screenedAddresses;
      }
    },
    [compositeClient]
  );

  // ------ Composers ------ //
  const GOV_ADDRESS = "dydx10d07y265gmmuvt4z0w9aw880jnsr700jnmapky"
  const DELAY_ADDRESS = "dydx1mkkvp26dngu6n8rmalaxyp3gwkjuzztq5zx6tr"

  const NATIVE_TOKEN = "adv4tnt"
  const INITIAL_DEPOSIT_AMOUNT = 1000000000

  const TYPE_URL_MSG_CREATE_ORACLE_MARKET = "/dydxprotocol.prices.MsgCreateOracleMarket"
  const TYPE_URL_MSG_CREATE_PERPETUAL = "/dydxprotocol.perpetuals.MsgCreatePerpetual"
  const TYPE_URL_MSG_CREATE_CLOB_PAIR = "/dydxprotocol.clob.MsgCreateClobPair"
  const TYPE_URL_MSG_UPDATE_CLOB_PAIR = "/dydxprotocol.clob.MsgUpdateClobPair"
  const TYPE_URL_MSG_DELAY_MESSAGE = "/dydxprotocol.delaymsg.MsgDelayMessage"
  const TYPE_URL_MSG_SUBMIT_PROPOSAL = "/cosmos.gov.v1.MsgSubmitProposal"

  const DEFAULT_DELAY_BLOCK = 30

  function composeMsgCreateOracleMarket(
    market_id: number,
    pair: string,
    exponent: number,
    min_exchanges: number,
    min_price_change_ppm: number,
    exchange_config_json: string,
  ): EncodeObject {
    const msg: pricetx.MsgCreateOracleMarket = {
      authority: GOV_ADDRESS,
      params: {
        id: market_id,
        pair: pair,
        exponent: exponent,
        minExchanges: min_exchanges,
        minPriceChangePpm: min_price_change_ppm,
        exchangeConfigJson: exchange_config_json,
      },
    };

    return {
      typeUrl: TYPE_URL_MSG_CREATE_ORACLE_MARKET,
      value: msg,
    };
  }

  function composeMsgCreatePerpetual(
    perpetual_id: number,
    market_id: number,
    ticker: string,
    atomic_resolution: number,
    default_funding_ppm: number,
    liquidity_tier: number,
  ): EncodeObject {
    const msg: perptx.MsgCreatePerpetual = {
      authority: GOV_ADDRESS,
      params: {
        id: perpetual_id,
        marketId: market_id,
        ticker: ticker,
        atomicResolution: atomic_resolution,
        defaultFundingPpm: default_funding_ppm,
        liquidityTier: liquidity_tier,
      },
    };

    return {
      typeUrl: TYPE_URL_MSG_CREATE_PERPETUAL,
      value: msg,
    };
  }


  function composeMsgCreateClobPair(
    clob_id: number,
    perpetual_id: number,
    quantum_conversion_exponent: number,
    step_base_quantums: Long,
    subticks_per_tick: number,
  ): EncodeObject {
    const msg: clobtx.MsgCreateClobPair = {
      authority: GOV_ADDRESS,
      clobPair: {
        id: clob_id,
        perpetualClobMetadata: {
          perpetualId: perpetual_id,
        },
        quantumConversionExponent: quantum_conversion_exponent,
        stepBaseQuantums: step_base_quantums,
        subticksPerTick: subticks_per_tick,
        status: clobpair.ClobPair_Status.STATUS_INITIALIZING,
      },
    };

    return {
      typeUrl: TYPE_URL_MSG_CREATE_CLOB_PAIR,
      value: msg,
    };
  }

  function composeMsgUpdateClobPair(
    clob_id: number,
    perpetual_id: number,
    quantum_conversion_exponent: number,
    step_base_quantums: Long,
    subticks_per_tick: number,
  ): EncodeObject {
    const msg: clobtx.MsgUpdateClobPair = {
      authority: DELAY_ADDRESS,
      clobPair: {
        id: clob_id,
        perpetualClobMetadata: {
          perpetualId: perpetual_id,
        },
        quantumConversionExponent: quantum_conversion_exponent,
        stepBaseQuantums: step_base_quantums,
        subticksPerTick: subticks_per_tick,
        status: clobpair.ClobPair_Status.STATUS_ACTIVE,
      },
    };

    return {
      typeUrl: TYPE_URL_MSG_UPDATE_CLOB_PAIR,
      value: msg,
    };
  }

  function composeMsgDelayMessage(
    embeddedMsg: EncodeObject,
    delay_blocks: number,
  ): EncodeObject {
    const msg: delaytx.MsgDelayMessage = {
      authority: GOV_ADDRESS, // all msgs sent to x/delay must be from x/gov module account.
      msg: embeddedMsg,
      delayBlocks: delay_blocks,
    }

    return {
      typeUrl: TYPE_URL_MSG_DELAY_MESSAGE,
      value: msg,
    }
  }

  function composeMsgSubmitProposal(
    title: string,
    initial_deposit_amount: number,
    summary: string,
    messages: EncodeObject[],
    proposer: string,
  ): EncodeObject {
    const initial_deposit: Coin[] = [{
      amount: initial_deposit_amount.toString(),
      denom: NATIVE_TOKEN,
    }];

    const msg: govtx.MsgSubmitProposal = {
      title,
      initialDeposit: initial_deposit,
      summary,
      messages,
      proposer,
      metadata: "",
      expedited: false,
    }

    return {
      typeUrl: TYPE_URL_MSG_SUBMIT_PROPOSAL,
      value: msg,
    };
  }

  // ------- Helper -------- //
  function getTitle(
    ticker: string,
  ): string {
    return `Add ${ticker} perpetual market`;
  }

  function getSummary(
    ticker: string,
    delay_blocks: number,
  ): string {
    return `Add the x/prices, x/perpetuals and x/clob parameters needed for a ${ticker} perpetual market. Create the market in INITIALIZING status and transition it to ACTIVE status after ${delay_blocks} blocks.`;
  }

  function wrapMessageAsAny(registry: Registry, message: EncodeObject): Any {
    return registry.encodeAsAny(message);
  }

  function wrapMessageArrAsAny(
    registry: Registry,
    messages: EncodeObject[],
  ): Any[] {
    const encodedMessages: Any[] = messages.map(
      (message: EncodeObject) => wrapMessageAsAny(registry, message)
    );
    return encodedMessages;
  }

  function generateRegistry(): Registry {
    return new Registry([
      // clob
      ['/dydxprotocol.clob.MsgPlaceOrder', MsgPlaceOrder as GeneratedType],
      ['/dydxprotocol.clob.MsgCancelOrder', MsgCancelOrder as GeneratedType],
      ['/dydxprotocol.clob.MsgCreateClobPair', MsgCreateClobPair as GeneratedType],
      ['/dydxprotocol.clob.MsgUpdateClobPair', MsgUpdateClobPair as GeneratedType],

      // delaymsg
      ['/dydxprotocol.delaymsg.MsgDelayMessage', MsgDelayMessage as GeneratedType],

      // perpetuals
      ['/dydxprotocol.perpetuals.MsgCreatePerpetual', MsgCreatePerpetual as GeneratedType],

      // prices
      ['/dydxprotocol.prices.MsgCreateOracleMarket', MsgCreateOracleMarket as GeneratedType],

      // sending
      ['/dydxprotocol.sending.MsgCreateTransfer', MsgCreateTransfer as GeneratedType],
      ['/dydxprotocol.sending.MsgWithdrawFromSubaccount', MsgWithdrawFromSubaccount as GeneratedType],
      ['/dydxprotocol.sending.MsgDepositToSubaccount', MsgDepositToSubaccount as GeneratedType],

      // default types
      ...defaultRegistryTypes,
    ]);
  }

  // ------ Proposal Methods ------ //
  function getAddNewMarketGovProposal(
    wallet_address: string,
    id: number,
    symbol: string,
    exponent: number,
    min_exchanges: number,
    min_price_change_ppm: number,
    exchange_config_json: string,
    atomic_resolution: number,
    default_funding_ppm: number,
    liquidity_tier: number,
    quantum_conversion_exponent: number,
    step_base_quantums: Long,
    subticks_per_tick: number,
  ): EncodeObject {
    const registry: Registry = generateRegistry()
    const msgs: EncodeObject[] = [];
    const createOracleMarket = composeMsgCreateOracleMarket(
      id,
      symbol,
      exponent,
      min_exchanges,
      min_price_change_ppm,
      exchange_config_json,
    );
    const createPerpetual = composeMsgCreatePerpetual(
      id,
      id,
      symbol,
      atomic_resolution,
      default_funding_ppm,
      liquidity_tier,
    );
    const createClobPair = composeMsgCreateClobPair(
      id,
      id,
      quantum_conversion_exponent,
      step_base_quantums,
      subticks_per_tick,
    );
    const updateClobPair = composeMsgUpdateClobPair(
      id,
      id,
      quantum_conversion_exponent,
      step_base_quantums,
      subticks_per_tick,
    );
    const delayMessage = composeMsgDelayMessage(
      wrapMessageAsAny(registry, updateClobPair), // IMPORTANT
      DEFAULT_DELAY_BLOCK,
    );
    msgs.push(createOracleMarket);
    msgs.push(createPerpetual);
    msgs.push(createClobPair);
    msgs.push(delayMessage);

    const submitProposal = composeMsgSubmitProposal(
      getTitle(symbol),
      INITIAL_DEPOSIT_AMOUNT,
      getSummary(symbol, DEFAULT_DELAY_BLOCK),
      wrapMessageArrAsAny(registry, msgs), // IMPORTANT: must wrap messages in Any type.
      wallet_address,
    );

    return submitProposal;
  };

  return {
    // Client initialization
    connect: setNetworkConfig,
    networkConfig,
    compositeClient,
    faucetClient,
    isConnected: !!compositeClient,

    // Wallet Methods
    getWalletFromEvmSignature,

    // Public Methods
    getCandlesForDatafeed,
    screenAddresses,

    // Proposal Methods
    getAddNewMarketGovProposal,
  };
};
