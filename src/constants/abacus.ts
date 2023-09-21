import Abacus, { kollections } from '@dydxprotocol/v4-abacus';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import { PositionSide, TradeTypes } from './trade';
import { STRING_KEYS } from './localization';

export type Nullable<T> = T | null | undefined;

// ------ V4 Protocols ------ //
export const IOImplementations = Abacus.exchange.dydx.abacus.utils.IOImplementations;
export const UIImplementations = Abacus.exchange.dydx.abacus.utils.UIImplementations;
export type AbacusDYDXChainTransactionsProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.DYDXChainTransactionsProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusRestProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.RestProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusWebsocketProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.WebSocketProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusStateNotificationProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.StateNotificationProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusLocalizerProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.LocalizerProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusFormatterProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.FormatterProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusThreadingProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.ThreadingProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusFileSystemProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.FileSystemProtocol,
  '__doNotUseOrImplementIt'
>;
export type AbacusTrackingProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.TrackingProtocol,
  '__doNotUseOrImplementIt'
>;

export type FileLocation = Abacus.exchange.dydx.abacus.protocols.FileLocation;
export type ThreadingType = Abacus.exchange.dydx.abacus.protocols.ThreadingType;
export const CoroutineTimer = Abacus.exchange.dydx.abacus.utils.CoroutineTimer;

// ------ Networking ------ //
export const QueryType = Abacus.exchange.dydx.abacus.protocols.QueryType;
const queryTypes = [...QueryType.values()] as const;
export type QueryTypes = (typeof queryTypes)[number];

export const TransactionType = Abacus.exchange.dydx.abacus.protocols.TransactionType;
const transactionTypes = [...TransactionType.values()] as const;
export type TransactionTypes = (typeof transactionTypes)[number];

export type NetworkConfig = {
  chainId: string;
  indexerUrl: string;
  indexerSocketUrl: string;
  validatorUrl: string;
  faucetUrl?: string | null;
};

export type ConnectNetworkEvent = CustomEvent<Partial<NetworkConfig>>;

// ------ State ------ //
export type AbacusApiState = Abacus.exchange.dydx.abacus.state.app.ApiState;
export const AbacusApiStatus = Abacus.exchange.dydx.abacus.state.app.ApiStatus;
const abacusApiStatuses = [...AbacusApiStatus.values()] as const;
export type AbacusApiStatuses = (typeof abacusApiStatuses)[number];
export const Changes = Abacus.exchange.dydx.abacus.state.changes.Changes;
export type PerpetualStateChanges = Abacus.exchange.dydx.abacus.state.changes.StateChanges;
export const AsyncAbacusStateManager =
  Abacus.exchange.dydx.abacus.state.manager.AsyncAbacusStateManager;

// ------ Parsing Errors ------ //
export type ParsingError = Abacus.exchange.dydx.abacus.responses.ParsingError;
export type ParsingErrors = kollections.List<ParsingError>;
export const ParsingErrorType = Abacus.exchange.dydx.abacus.responses.ParsingErrorType;
const parsingErrorTypes = [...ParsingErrorType.values()] as const;
export type ParsingErrorTypes = (typeof parsingErrorTypes)[number];

// ------ Perpetuals/Markets ------ //
export type PerpetualState = Abacus.exchange.dydx.abacus.output.PerpetualState;
export type MarketCandles = Abacus.exchange.dydx.abacus.output.MarketCandles;
export type MarketOrderbook = Abacus.exchange.dydx.abacus.output.MarketOrderbook;
export type MarketPerpetual = Abacus.exchange.dydx.abacus.output.MarketPerpetual;
export type MarketStatus = Abacus.exchange.dydx.abacus.output.MarketStatus;
export type MarketTrade = Abacus.exchange.dydx.abacus.output.MarketTrade;
export type MarketTrades = kollections.List<Abacus.exchange.dydx.abacus.output.MarketTrade>;
export type MarketsSummary = Partial<Abacus.exchange.dydx.abacus.output.PerpetualMarketSummary>;
export type OrderbookLine = Abacus.exchange.dydx.abacus.output.OrderbookLine;
export type PerpetualMarket = Abacus.exchange.dydx.abacus.output.PerpetualMarket;
export type MarketHistoricalFunding = Abacus.exchange.dydx.abacus.output.MarketHistoricalFunding;

// ------ Configs ------ //
export type Configs = Abacus.exchange.dydx.abacus.output.Configs;
export type FeeDiscount = Abacus.exchange.dydx.abacus.output.FeeDiscount;
export type FeeDiscountResources = Abacus.exchange.dydx.abacus.output.FeeDiscountResources;
export type FeeTier = Abacus.exchange.dydx.abacus.output.FeeTier;
export type FeeTierResources = Abacus.exchange.dydx.abacus.output.FeeTierResources;
export type NetworkConfigs = Abacus.exchange.dydx.abacus.output.NetworkConfigs;

// ------ Assets ------ //
export type Asset = Abacus.exchange.dydx.abacus.output.Asset;
export type AssetResources = Abacus.exchange.dydx.abacus.output.AssetResources;

// ------ Inputs ------ //
export type Inputs = Abacus.exchange.dydx.abacus.output.input.Input;
export type TradeInputs = Abacus.exchange.dydx.abacus.output.input.TradeInput;
export type ClosePositionInputs = Abacus.exchange.dydx.abacus.output.input.ClosePositionInput;
export type TradeInputSummary = Abacus.exchange.dydx.abacus.output.input.TradeInputSummary;
export type TransferInputs = Abacus.exchange.dydx.abacus.output.input.TransferInput;
export type InputError = Abacus.exchange.dydx.abacus.output.input.ValidationError;
export type TransferInputTokenResource =
  Abacus.exchange.dydx.abacus.output.input.TransferInputTokenResource;
export type TransferInputChainResource =
  Abacus.exchange.dydx.abacus.output.input.TransferInputChainResource;
export type SelectionOption = Abacus.exchange.dydx.abacus.output.input.SelectionOption;
export const ErrorType = Abacus.exchange.dydx.abacus.output.input.ErrorType;
export const InputSelectionOption = Abacus.exchange.dydx.abacus.output.input.SelectionOption;

// ------ Wallet ------ //
export type Wallet = Abacus.exchange.dydx.abacus.output.Wallet;
export type Subaccount = Abacus.exchange.dydx.abacus.output.Subaccount;
export type SubaccountPosition = Abacus.exchange.dydx.abacus.output.SubaccountPosition;
export type SubaccountOrder = Abacus.exchange.dydx.abacus.output.SubaccountOrder;
export type OrderStatus = Abacus.exchange.dydx.abacus.output.input.OrderStatus;
export const AbacusOrderStatus = Abacus.exchange.dydx.abacus.output.input.OrderStatus;
export type SubaccountFills = Abacus.exchange.dydx.abacus.output.SubaccountFill[];
export type SubaccountFill = Abacus.exchange.dydx.abacus.output.SubaccountFill;
export type SubaccountFundingPayment = Abacus.exchange.dydx.abacus.output.SubaccountFundingPayment;
export type SubaccountFundingPayments =
  Abacus.exchange.dydx.abacus.output.SubaccountFundingPayment[];
export type SubaccountTransfer = Abacus.exchange.dydx.abacus.output.SubaccountTransfer;
export type SubaccountTransfers = Abacus.exchange.dydx.abacus.output.SubaccountTransfer[];

// ------ Historical PnL ------ //
export type SubAccountHistoricalPNL = Abacus.exchange.dydx.abacus.output.SubaccountHistoricalPNL;
export type SubAccountHistoricalPNLs = Abacus.exchange.dydx.abacus.output.SubaccountHistoricalPNL[];
export const HistoricalPnlPeriod = Abacus.exchange.dydx.abacus.state.app.HistoricalPnlPeriod;
const historicalPnlPeriod = [...HistoricalPnlPeriod.values()] as const;
export type HistoricalPnlPeriods = (typeof historicalPnlPeriod)[number];

// ------ Transfer Items ------ //
export const TransferInputField = Abacus.exchange.dydx.abacus.state.modal.TransferInputField;
const transferInputFields = [...TransferInputField.values()] as const;
export type TransferInputFields = (typeof transferInputFields)[number];

export const TransferType = Abacus.exchange.dydx.abacus.output.input.TransferType;
const transferTypes = [...TransferType.values()] as const;
export type TransferTypes = (typeof transferTypes)[number];

// ------ Trade Items ------ //
export const TradeInputField = Abacus.exchange.dydx.abacus.state.modal.TradeInputField;
const tradeInputFields = [...TradeInputField.values()] as const;
export type TradeInputFields = (typeof tradeInputFields)[number];

export type TradeState<T> = {
  current?: Nullable<T>;
  postAllOrders?: Nullable<T>;
  postOrder?: Nullable<T>;
};

export const ClosePositionInputField =
  Abacus.exchange.dydx.abacus.state.modal.ClosePositionInputField;

const closePositionInputFields = [...ClosePositionInputField.values()] as const;
export type ClosePositionInputFields = (typeof closePositionInputFields)[number];

export type ValidationError = Abacus.exchange.dydx.abacus.output.input.ValidationError;
export const TradeInputErrorAction = Abacus.exchange.dydx.abacus.output.input.ErrorAction;
export type AbacusOrderTypes = Abacus.exchange.dydx.abacus.output.input.OrderType;
export type AbacusOrderSides = Abacus.exchange.dydx.abacus.output.input.OrderSide;
export const AbacusOrderType = Abacus.exchange.dydx.abacus.output.input.OrderType;
export const AbacusOrderSide = Abacus.exchange.dydx.abacus.output.input.OrderSide;

export const AbacusPositionSide = Abacus.exchange.dydx.abacus.output.PositionSide;
export type AbacusPositionSides = Abacus.exchange.dydx.abacus.output.PositionSide;

export type SubaccountPlaceOrderPayload =
  Abacus.exchange.dydx.abacus.state.app.V4SubaccountPlaceOrderPayload2;

export type SubaccountCancelOrderPayload =
  Abacus.exchange.dydx.abacus.state.app.V4SubaccountCancelOrderPayload2;

export type HumanReadablePlaceOrderPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadablePlaceOrderPayload;
export type HumanReadableCancelOrderPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadableCancelOrderPayload;

// ------ Helpers ------ //
export const AbacusHelper = Abacus.exchange.dydx.abacus.utils.AbacusHelper;

export const RiskLevel = Abacus.exchange.dydx.abacus.utils.RiskLevel;
const riskLevels = [...RiskLevel.values()] as const;
export type RiskLevels = (typeof riskLevels)[number];

// ------ Notifications ------ //
export type AbacusNotification = Abacus.exchange.dydx.abacus.output.Notification;

// ------ Enum Conversions ------ //
type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? A
  : B;

type ReadonlyKeysOf<T> = {
  [K in keyof T]: IfEquals<{ [_ in K]: T[K] }, { readonly [_ in K]: T[K] }, K, never>;
}[keyof T];

type KotlinIrEnumValues<T> = Exclude<ReadonlyKeysOf<T>, 'Companion' | '$serializer'>;

export const ORDER_SIDES: Record<KotlinIrEnumValues<typeof AbacusOrderSide>, OrderSide> = {
  [AbacusOrderSide.buy.name]: OrderSide.BUY,
  [AbacusOrderSide.sell.name]: OrderSide.SELL,
};

export const POSITION_SIDES: Record<KotlinIrEnumValues<typeof AbacusPositionSide>, PositionSide> = {
  [AbacusPositionSide.LONG.name]: PositionSide.Long,
  [AbacusPositionSide.SHORT.name]: PositionSide.Short,
  [AbacusPositionSide.NONE.name]: PositionSide.None,
};

export const HISTORICAL_PNL_PERIODS: Record<
  KotlinIrEnumValues<typeof HistoricalPnlPeriod>,
  HistoricalPnlPeriods
> = {
  [HistoricalPnlPeriod.Period1d.name]: HistoricalPnlPeriod.Period1d,
  [HistoricalPnlPeriod.Period7d.name]: HistoricalPnlPeriod.Period7d,
  [HistoricalPnlPeriod.Period30d.name]: HistoricalPnlPeriod.Period30d,
  [HistoricalPnlPeriod.Period90d.name]: HistoricalPnlPeriod.Period90d,
};

export const ORDER_STATUS_STRINGS: Record<KotlinIrEnumValues<typeof AbacusOrderStatus>, string> = {
  [AbacusOrderStatus.open.name]: STRING_KEYS.OPEN_STATUS,
  [AbacusOrderStatus.partiallyFilled.name]: STRING_KEYS.PARTIALLY_FILLED,
  [AbacusOrderStatus.filled.name]: STRING_KEYS.ORDER_FILLED,
  [AbacusOrderStatus.cancelled.name]: STRING_KEYS.CANCELED,
  [AbacusOrderStatus.canceling.name]: STRING_KEYS.CANCELING,
  [AbacusOrderStatus.pending.name]: STRING_KEYS.PENDING,
  [AbacusOrderStatus.untriggered.name]: STRING_KEYS.UNTRIGGERED,
};

export const TRADE_TYPES: Record<
  KotlinIrEnumValues<typeof AbacusOrderType>,
  Nullable<TradeTypes>
> = {
  [AbacusOrderType.limit.name]: TradeTypes.LIMIT,
  [AbacusOrderType.market.name]: TradeTypes.MARKET,
  [AbacusOrderType.stopLimit.name]: TradeTypes.STOP_LIMIT,
  [AbacusOrderType.stopMarket.name]: TradeTypes.STOP_MARKET,
  [AbacusOrderType.takeProfitLimit.name]: TradeTypes.TAKE_PROFIT,
  [AbacusOrderType.takeProfitMarket.name]: TradeTypes.TAKE_PROFIT_MARKET,

  [AbacusOrderType.liquidated.name]: null,
  [AbacusOrderType.liquidation.name]: null,
  [AbacusOrderType.trailingStop.name]: null,
};
