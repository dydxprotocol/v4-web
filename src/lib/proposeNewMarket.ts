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
import Long from 'long';
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
import { MsgCreateTransfer } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/sending/tx';

import { MustBigNumber } from './numbers';

// ------ Composers ------ //
export const GOV_ADDRESS = 'dydx10d07y265gmmuvt4z0w9aw880jnsr700jnmapky';
export const DELAY_ADDRESS = 'dydx1mkkvp26dngu6n8rmalaxyp3gwkjuzztq5zx6tr';

export const NATIVE_TOKEN = 'adv4tnt';
export const INITIAL_DEPOSIT_AMOUNT = 1000000000;

const TYPE_URL_MSG_CREATE_ORACLE_MARKET = "/dydxprotocol.prices.MsgCreateOracleMarket"
const TYPE_URL_MSG_CREATE_PERPETUAL = "/dydxprotocol.perpetuals.MsgCreatePerpetual"
const TYPE_URL_MSG_CREATE_CLOB_PAIR = "/dydxprotocol.clob.MsgCreateClobPair"
const TYPE_URL_MSG_UPDATE_CLOB_PAIR = "/dydxprotocol.clob.MsgUpdateClobPair"
const TYPE_URL_MSG_DELAY_MESSAGE = "/dydxprotocol.delaymsg.MsgDelayMessage"
const TYPE_URL_MSG_SUBMIT_PROPOSAL = "/cosmos.gov.v1.MsgSubmitProposal"
export const DEFAULT_DELAY_BLOCK = 5;

export function composeMsgCreateOracleMarket(
  market_id: number,
  pair: string,
  exponent: number,
  min_exchanges: number,
  min_price_change_ppm: number,
  exchange_config_json: string
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

export function composeMsgCreatePerpetual(
  perpetual_id: number,
  market_id: number,
  ticker: string,
  atomic_resolution: number,
  default_funding_ppm: number,
  liquidity_tier: number
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

export function composeMsgCreateClobPair(
  clob_id: number,
  perpetual_id: number,
  quantum_conversion_exponent: number,
  step_base_quantums: Long,
  subticks_per_tick: number
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

export function composeMsgUpdateClobPair(
  clob_id: number,
  perpetual_id: number,
  quantum_conversion_exponent: number,
  step_base_quantums: Long,
  subticks_per_tick: number
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

export function composeMsgDelayMessage(
  embeddedMsg: EncodeObject,
  delay_blocks: number
): EncodeObject {
  const msg: delaytx.MsgDelayMessage = {
    authority: GOV_ADDRESS, // all msgs sent to x/delay must be from x/gov module account.
    msg: embeddedMsg,
    delayBlocks: delay_blocks,
  };

  return {
    typeUrl: TYPE_URL_MSG_DELAY_MESSAGE,
    value: msg,
  };
}

export function composeMsgSubmitProposal(
  title: string,
  initial_deposit_amount: number,
  summary: string,
  messages: EncodeObject[],
  proposer: string
): EncodeObject {
  const initial_deposit: Coin[] = [
    {
      amount: MustBigNumber(initial_deposit_amount).toString(),
      denom: NATIVE_TOKEN,
    },
  ];

  const msg: govtx.MsgSubmitProposal = {
    title,
    initialDeposit: initial_deposit,
    summary,
    messages,
    proposer,
    metadata: '',
    expedited: false,
  };

  return {
    typeUrl: TYPE_URL_MSG_SUBMIT_PROPOSAL,
    value: msg,
  };
}

// ------- Helper -------- //
export function getTitle(ticker: string): string {
  return `Add ${ticker} perpetual market`;
}

export function getSummary(ticker: string, delay_blocks: number): string {
  return `Add the x/prices, x/perpetuals and x/clob parameters needed for a ${ticker} perpetual market. Create the market in INITIALIZING status and transition it to ACTIVE status after ${delay_blocks} blocks.`;
}

export function wrapMessageAsAny(registry: Registry, message: EncodeObject): Any {
  return registry.encodeAsAny(message);
}

export function wrapMessageArrAsAny(registry: Registry, messages: EncodeObject[]): Any[] {
  const encodedMessages: Any[] = messages.map((message: EncodeObject) =>
    wrapMessageAsAny(registry, message)
  );
  return encodedMessages;
}

export function generateRegistry(): Registry {
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

export function getAddNewMarketGovProposal({
  walletAddress,
  id,
  symbol,
  exponent,
  minExchanges,
  minPriceChangePpm,
  exchangeConfigJson,
  atomicResolution,
  defaultFundingPpm,
  liquidityTier,
  quantumConversionExponent,
  stepBaseQuantums,
  subticksPerTick,
}: {
  walletAddress: string;
  id: number;
  symbol: string;
  exponent: number;
  minExchanges: number;
  minPriceChangePpm: number;
  exchangeConfigJson: string;
  atomicResolution: number;
  defaultFundingPpm: number;
  liquidityTier: number;
  quantumConversionExponent: number;
  stepBaseQuantums: Long;
  subticksPerTick: number;
}): Promise<EncodeObject[]> {
  const registry: Registry = generateRegistry();
  console.log(registry);
  const msgs: EncodeObject[] = [];
  const createOracleMarket = composeMsgCreateOracleMarket(
    id,
    `${symbol}-USD`,
    exponent,
    minExchanges,
    minPriceChangePpm,
    exchangeConfigJson
  );
  const createPerpetual = composeMsgCreatePerpetual(
    id,
    id,
    `${symbol}-USD`,
    atomicResolution,
    defaultFundingPpm,
    liquidityTier
  );
  const createClobPair = composeMsgCreateClobPair(
    id,
    id,
    quantumConversionExponent,
    stepBaseQuantums,
    subticksPerTick
  );
  const updateClobPair = composeMsgUpdateClobPair(
    id,
    id,
    quantumConversionExponent,
    stepBaseQuantums,
    subticksPerTick
  );
  const delayMessage = composeMsgDelayMessage(
    wrapMessageAsAny(registry, updateClobPair), // IMPORTANT
    DEFAULT_DELAY_BLOCK
  );
  msgs.push(createOracleMarket);
  msgs.push(createPerpetual);
  msgs.push(createClobPair);
  msgs.push(delayMessage);

  const submitProposal = composeMsgSubmitProposal(
    getTitle(`${symbol}-USD`),
    INITIAL_DEPOSIT_AMOUNT,
    getSummary(`${symbol}-USD`, DEFAULT_DELAY_BLOCK),
    wrapMessageArrAsAny(registry, msgs), // IMPORTANT: must wrap messages in Any type.
    walletAddress
  );

  const encodedObjects: Promise<EncodeObject[]> = Promise.resolve([submitProposal]);
  return encodedObjects;
}
