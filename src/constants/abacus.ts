import Abacus, { kollections } from '@dydxprotocol/v4-abacus';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from './localization';
import { TradeTypes } from './trade';

export type Nullable<T> = T | null | undefined;

// ------ V4 Protocols ------ //
export const AbacusAppConfig = Abacus.exchange.dydx.abacus.state.v2.supervisor.AppConfigsV2;
export const OnboardingConfig = Abacus.exchange.dydx.abacus.state.v2.supervisor.OnboardingConfigs;
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
export type AbacusLoggingProtocol = Omit<
  Abacus.exchange.dydx.abacus.protocols.LoggingProtocol,
  '__doNotUseOrImplementIt'
>;

export type ThreadingType = Abacus.exchange.dydx.abacus.protocols.ThreadingType;
export const CoroutineTimer = Abacus.exchange.dydx.abacus.utils.CoroutineTimer;

// ------ Networking ------ //
export const QueryType = Abacus.exchange.dydx.abacus.protocols.QueryType;
const queryTypes = [...QueryType.values()] as const;
export type QueryTypes = (typeof queryTypes)[number];

export const TransactionType = Abacus.exchange.dydx.abacus.protocols.TransactionType;
const transactionTypes = [...TransactionType.values()] as const;
export type TransactionTypes = (typeof transactionTypes)[number];

// ------ State ------
export type AbacusApiState = Abacus.exchange.dydx.abacus.state.manager.ApiState;
export const AbacusApiStatus = Abacus.exchange.dydx.abacus.state.manager.ApiStatus;
export const Changes = Abacus.exchange.dydx.abacus.state.changes.Changes;
export type PerpetualStateChanges = Abacus.exchange.dydx.abacus.state.changes.StateChanges;
export const AsyncAbacusStateManager =
  Abacus.exchange.dydx.abacus.state.v2.manager.AsyncAbacusStateManagerV2;

// ------ Parsing Errors ------ //
export type ParsingError = Abacus.exchange.dydx.abacus.responses.ParsingError;
export type ParsingErrors = kollections.List<ParsingError>;

// ------ Perpetuals/Markets ------ //
export type PerpetualState = Abacus.exchange.dydx.abacus.output.PerpetualState;
export type MarketOrderbook = Abacus.exchange.dydx.abacus.output.MarketOrderbook;
export type MarketOrderbookGrouping = Abacus.exchange.dydx.abacus.output.MarketOrderbookGrouping;
export type MarketTrade = Abacus.exchange.dydx.abacus.output.MarketTrade;
export type OrderbookLine = Abacus.exchange.dydx.abacus.output.OrderbookLine;
export type PerpetualMarket = Abacus.exchange.dydx.abacus.output.PerpetualMarket;
export type MarketConfigs = Abacus.exchange.dydx.abacus.output.MarketConfigs;
export type MarketHistoricalFunding = Abacus.exchange.dydx.abacus.output.MarketHistoricalFunding;
export const PerpetualMarketType = Abacus.exchange.dydx.abacus.output.PerpetualMarketType;

// ------ Configs ------ //
export const StatsigConfig = Abacus.exchange.dydx.abacus.state.manager.StatsigConfig;
export type Configs = Abacus.exchange.dydx.abacus.output.Configs;
export type FeeDiscount = Abacus.exchange.dydx.abacus.output.FeeDiscount;
export type FeeTier = Abacus.exchange.dydx.abacus.output.FeeTier;
export type EquityTiers = Abacus.exchange.dydx.abacus.output.EquityTiers;
export type EquityTier = Abacus.exchange.dydx.abacus.output.EquityTier;
export type NetworkConfigs = Abacus.exchange.dydx.abacus.output.NetworkConfigs;

// ------ Assets ------ //
export type Asset = Abacus.exchange.dydx.abacus.output.Asset;
export type TransferChainInfo = Abacus.exchange.dydx.abacus.state.manager.TransferChainInfo;

// ------ Inputs ------ //
export type Inputs = Abacus.exchange.dydx.abacus.output.input.Input;
export type TradeInputs = Abacus.exchange.dydx.abacus.output.input.TradeInput;
export type ClosePositionInputs = Abacus.exchange.dydx.abacus.output.input.ClosePositionInput;
export type TradeInputSummary = Abacus.exchange.dydx.abacus.output.input.TradeInputSummary;
export type TransferInputs = Abacus.exchange.dydx.abacus.output.input.TransferInput;
export type TriggerOrdersInputs = Abacus.exchange.dydx.abacus.output.input.TriggerOrdersInput;
export type AdjustIsolatedMarginInputs =
  Abacus.exchange.dydx.abacus.output.input.AdjustIsolatedMarginInput;
export type InputError = Abacus.exchange.dydx.abacus.output.input.ValidationError;
export type TransferInputTokenResource =
  Abacus.exchange.dydx.abacus.output.input.TransferInputTokenResource;
export const ErrorType = Abacus.exchange.dydx.abacus.output.input.ErrorType;
export const ErrorFormat = Abacus.exchange.dydx.abacus.output.input.ErrorFormat;
const errorFormats = [...ErrorFormat.values()] as const;
export type ErrorFormatType = (typeof errorFormats)[number];

// ------ Wallet ------ //
export type Wallet = Abacus.exchange.dydx.abacus.output.Wallet;
export type AccountBalance = Abacus.exchange.dydx.abacus.output.account.AccountBalance;
export type StakingDelegation = Abacus.exchange.dydx.abacus.output.account.StakingDelegation;
export type UnbondingDelegation = Abacus.exchange.dydx.abacus.output.account.UnbondingDelegation;
export type StakingRewards = Abacus.exchange.dydx.abacus.output.account.StakingRewards;
export type TradingRewards = Abacus.exchange.dydx.abacus.output.account.TradingRewards;
export type HistoricalTradingReward =
  Abacus.exchange.dydx.abacus.output.account.HistoricalTradingReward;
export const HistoricalTradingRewardsPeriod =
  Abacus.exchange.dydx.abacus.state.manager.HistoricalTradingRewardsPeriod;
const historicalTradingRewardsPeriod = [...HistoricalTradingRewardsPeriod.values()] as const;
export type HistoricalTradingRewardsPeriods = (typeof historicalTradingRewardsPeriod)[number];

export type Subaccount = Abacus.exchange.dydx.abacus.output.account.Subaccount;
export type SubaccountPosition = Abacus.exchange.dydx.abacus.output.account.SubaccountPosition;
export type SubaccountPendingPosition =
  Abacus.exchange.dydx.abacus.output.account.SubaccountPendingPosition;
export type SubaccountOrder = Abacus.exchange.dydx.abacus.output.account.SubaccountOrder;
export type OrderStatus = Abacus.exchange.dydx.abacus.output.input.OrderStatus;
export const AbacusOrderStatus = Abacus.exchange.dydx.abacus.output.input.OrderStatus;
const abacusOrderStatuses = [...AbacusOrderStatus.values()] as const;
export type AbacusOrderStatuses = (typeof abacusOrderStatuses)[number];
export type SubaccountFills = Abacus.exchange.dydx.abacus.output.account.SubaccountFill[];
export type SubaccountFill = Abacus.exchange.dydx.abacus.output.account.SubaccountFill;
export type SubaccountFundingPayment =
  Abacus.exchange.dydx.abacus.output.account.SubaccountFundingPayment;
export type SubaccountFundingPayments =
  Abacus.exchange.dydx.abacus.output.account.SubaccountFundingPayment[];
export type SubaccountTransfer = Abacus.exchange.dydx.abacus.output.account.SubaccountTransfer;
export type SubaccountTransfers = Abacus.exchange.dydx.abacus.output.account.SubaccountTransfer[];

// ------ Historical PnL ------ //
export type SubAccountHistoricalPNLs =
  Abacus.exchange.dydx.abacus.output.account.SubaccountHistoricalPNL[];
export const HistoricalPnlPeriod = Abacus.exchange.dydx.abacus.state.manager.HistoricalPnlPeriod;
const historicalPnlPeriod = [...HistoricalPnlPeriod.values()] as const;
export type HistoricalPnlPeriods = (typeof historicalPnlPeriod)[number];

// ------ Transfer Items ------ //
export const TransferInputField = Abacus.exchange.dydx.abacus.state.model.TransferInputField;
const transferInputFields = [...TransferInputField.values()] as const;
export type TransferInputFields = (typeof transferInputFields)[number];

export const TransferType = Abacus.exchange.dydx.abacus.output.input.TransferType;
export type TransferTypeType = Abacus.exchange.dydx.abacus.output.input.TransferType;

export const AdjustIsolatedMarginInputField =
  Abacus.exchange.dydx.abacus.state.model.AdjustIsolatedMarginInputField;
const adjustIsolatedMarginInputFields = [...AdjustIsolatedMarginInputField.values()] as const;
export type AdjustIsolatedMarginInputFields = (typeof adjustIsolatedMarginInputFields)[number];
export const IsolatedMarginAdjustmentType =
  Abacus.exchange.dydx.abacus.output.input.IsolatedMarginAdjustmentType;

// ------ Trade Items ------ //
export const TradeInputField = Abacus.exchange.dydx.abacus.state.model.TradeInputField;
const tradeInputFields = [...TradeInputField.values()] as const;
export type TradeInputFields = (typeof tradeInputFields)[number];

export type TradeState<T> = {
  current?: Nullable<T>;
  postAllOrders?: Nullable<T>;
  postOrder?: Nullable<T>;
};

export const ClosePositionInputField =
  Abacus.exchange.dydx.abacus.state.model.ClosePositionInputField;

const closePositionInputFields = [...ClosePositionInputField.values()] as const;
export type ClosePositionInputFields = (typeof closePositionInputFields)[number];

// ------ Trigger Order Items ------ //
export const TriggerOrdersInputField =
  Abacus.exchange.dydx.abacus.state.model.TriggerOrdersInputField;
const triggerOrdersInputFields = [...TriggerOrdersInputField.values()] as const;
export type TriggerOrdersInputFields = (typeof triggerOrdersInputFields)[number];
export type TriggerOrdersInputPrice = Abacus.exchange.dydx.abacus.output.input.TriggerPrice;

export type ValidationError = Abacus.exchange.dydx.abacus.output.input.ValidationError;
export const TradeInputErrorAction = Abacus.exchange.dydx.abacus.output.input.ErrorAction;
export type AbacusOrderTypes = Abacus.exchange.dydx.abacus.output.input.OrderType;
export type AbacusOrderSides = Abacus.exchange.dydx.abacus.output.input.OrderSide;
export const AbacusOrderType = Abacus.exchange.dydx.abacus.output.input.OrderType;
export const AbacusOrderSide = Abacus.exchange.dydx.abacus.output.input.OrderSide;

export const AbacusPositionSide = Abacus.exchange.dydx.abacus.output.account.PositionSide;
export type AbacusPositionSides = Abacus.exchange.dydx.abacus.output.account.PositionSide;

export const AbacusMarginMode = Abacus.exchange.dydx.abacus.output.input.MarginMode;

export type HumanReadablePlaceOrderPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadablePlaceOrderPayload;
export type HumanReadableCancelOrderPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadableCancelOrderPayload;
export type HumanReadableTriggerOrdersPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadableTriggerOrdersPayload;
export type HumanReadableWithdrawPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadableWithdrawPayload;
export type HumanReadableTransferPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadableTransferPayload;
export type HumanReadableSubaccountTransferPayload =
  Abacus.exchange.dydx.abacus.state.manager.HumanReadableSubaccountTransferPayload;
export const PlaceOrderMarketInfo = Abacus.exchange.dydx.abacus.state.manager.PlaceOrderMarketInfo;

export type OrderbookGroupings = Abacus.exchange.dydx.abacus.state.manager.OrderbookGrouping;
export const OrderbookGrouping = Abacus.exchange.dydx.abacus.state.manager.OrderbookGrouping;

// ------ Helpers ------ //
export const AbacusHelper = Abacus.exchange.dydx.abacus.utils.AbacusHelper;

const RiskLevel = Abacus.exchange.dydx.abacus.utils.RiskLevel;
const riskLevels = [...RiskLevel.values()] as const;
export type RiskLevels = (typeof riskLevels)[number];

// ------ Notifications ------ //
export type AbacusNotification = Abacus.exchange.dydx.abacus.output.Notification;

// ------ Restrictions ------ //
export type UsageRestriction = Abacus.exchange.dydx.abacus.output.UsageRestriction;
export const RestrictionType = Abacus.exchange.dydx.abacus.output.Restriction;

// ------ Compliance ------ //
export const ComplianceStatus = Abacus.exchange.dydx.abacus.output.ComplianceStatus;
export const ComplianceAction = Abacus.exchange.dydx.abacus.output.ComplianceAction;
export type Compliance = Abacus.exchange.dydx.abacus.output.Compliance;

// Vaults

export type VaultDetails = Abacus.exchange.dydx.abacus.functional.vault.VaultDetails;
export type VaultPositions = Abacus.exchange.dydx.abacus.functional.vault.VaultPositions;
export type VaultAccount = Abacus.exchange.dydx.abacus.functional.vault.VaultAccount;
export type VaultTransfer = Abacus.exchange.dydx.abacus.functional.vault.VaultTransfer;
export type VaultPosition = Abacus.exchange.dydx.abacus.functional.vault.VaultPosition;
export type VaultFormValidationErrorType =
  Abacus.exchange.dydx.abacus.functional.vault.VaultFormValidationErrorType;
export const VaultFormData = Abacus.exchange.dydx.abacus.functional.vault.VaultFormData;
export const VaultFormAction = Abacus.exchange.dydx.abacus.functional.vault.VaultFormAction;
export const VaultFormAccountData =
  Abacus.exchange.dydx.abacus.functional.vault.VaultFormAccountData;
export type VaultDepositWithdrawSlippageResponse =
  Abacus.exchange.dydx.abacus.functional.vault.VaultDepositWithdrawSlippageResponse;
export type VaultFormValidationResult =
  Abacus.exchange.dydx.abacus.functional.vault.VaultFormValidationResult;
export const { VaultCalculator, VaultAccountCalculator, VaultDepositWithdrawFormValidator } =
  Abacus.exchange.dydx.abacus.functional.vault;

// ------ Api data ------ //
export const ApiData = Abacus.exchange.dydx.abacus.state.manager.ApiData;

// ------ Enum Conversions ------ //
type IfEquals<X, Y, A, B> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type ReadonlyKeysOf<T> = {
  [K in keyof T]: IfEquals<{ [_ in K]: T[K] }, { readonly [_ in K]: T[K] }, K, never>;
}[keyof T];

export type KotlinIrEnumValues<T> = Exclude<ReadonlyKeysOf<T>, 'Companion' | '$serializer'>;

export const ORDER_SIDES: Record<KotlinIrEnumValues<typeof AbacusOrderSide>, OrderSide> = {
  [AbacusOrderSide.Buy.name]: OrderSide.BUY,
  [AbacusOrderSide.Sell.name]: OrderSide.SELL,
  [AbacusOrderSide.Buy.rawValue]: OrderSide.BUY,
  [AbacusOrderSide.Sell.rawValue]: OrderSide.SELL,
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

export const HISTORICAL_TRADING_REWARDS_PERIODS: Record<
  KotlinIrEnumValues<typeof HistoricalTradingRewardsPeriod>,
  HistoricalTradingRewardsPeriods
> = {
  [HistoricalTradingRewardsPeriod.MONTHLY.name]: HistoricalTradingRewardsPeriod.MONTHLY,
  [HistoricalTradingRewardsPeriod.WEEKLY.name]: HistoricalTradingRewardsPeriod.WEEKLY,
  [HistoricalTradingRewardsPeriod.DAILY.name]: HistoricalTradingRewardsPeriod.DAILY,
};

export const ORDER_STATUS_STRINGS: Record<KotlinIrEnumValues<typeof AbacusOrderStatus>, string> = {
  [AbacusOrderStatus.Open.name]: STRING_KEYS.OPEN_STATUS,
  [AbacusOrderStatus.Open.rawValue]: STRING_KEYS.OPEN_STATUS,

  [AbacusOrderStatus.PartiallyFilled.name]: STRING_KEYS.PARTIALLY_FILLED,
  [AbacusOrderStatus.PartiallyFilled.rawValue]: STRING_KEYS.PARTIALLY_FILLED,

  [AbacusOrderStatus.PartiallyCanceled.name]: STRING_KEYS.PARTIALLY_FILLED,
  [AbacusOrderStatus.PartiallyCanceled.rawValue]: STRING_KEYS.PARTIALLY_FILLED,

  [AbacusOrderStatus.Filled.name]: STRING_KEYS.ORDER_FILLED,
  [AbacusOrderStatus.Filled.rawValue]: STRING_KEYS.ORDER_FILLED,

  [AbacusOrderStatus.Canceled.name]: STRING_KEYS.CANCELED,
  [AbacusOrderStatus.Canceled.rawValue]: STRING_KEYS.CANCELED,

  [AbacusOrderStatus.Canceling.name]: STRING_KEYS.CANCELING,
  [AbacusOrderStatus.Canceling.rawValue]: STRING_KEYS.CANCELING,

  [AbacusOrderStatus.Pending.name]: STRING_KEYS.PENDING,
  [AbacusOrderStatus.Pending.rawValue]: STRING_KEYS.PENDING,

  [AbacusOrderStatus.Untriggered.name]: STRING_KEYS.CREATED,
  [AbacusOrderStatus.Untriggered.rawValue]: STRING_KEYS.CREATED,
};

export const TRADE_TYPES: Record<
  KotlinIrEnumValues<typeof AbacusOrderType>,
  Nullable<TradeTypes>
> = {
  [AbacusOrderType.Limit.name]: TradeTypes.LIMIT,
  [AbacusOrderType.Limit.rawValue]: TradeTypes.LIMIT,

  [AbacusOrderType.Market.name]: TradeTypes.MARKET,
  [AbacusOrderType.Market.rawValue]: TradeTypes.MARKET,

  [AbacusOrderType.StopLimit.name]: TradeTypes.STOP_LIMIT,
  [AbacusOrderType.StopLimit.rawValue]: TradeTypes.STOP_LIMIT,

  [AbacusOrderType.StopMarket.name]: TradeTypes.STOP_MARKET,
  [AbacusOrderType.StopMarket.rawValue]: TradeTypes.STOP_MARKET,

  [AbacusOrderType.TakeProfitLimit.name]: TradeTypes.TAKE_PROFIT,
  [AbacusOrderType.TakeProfitLimit.rawValue]: TradeTypes.TAKE_PROFIT,

  [AbacusOrderType.TakeProfitMarket.name]: TradeTypes.TAKE_PROFIT_MARKET,
  [AbacusOrderType.TakeProfitMarket.rawValue]: TradeTypes.TAKE_PROFIT_MARKET,

  [AbacusOrderType.Liquidated.name]: null,
  [AbacusOrderType.Liquidated.rawValue]: null,

  [AbacusOrderType.Liquidation.name]: null,
  [AbacusOrderType.Liquidation.rawValue]: null,

  [AbacusOrderType.TrailingStop.name]: null,
  [AbacusOrderType.TrailingStop.rawValue]: null,

  [AbacusOrderType.Offsetting.name]: null,
  [AbacusOrderType.Offsetting.rawValue]: null,

  [AbacusOrderType.Deleveraged.name]: null,
  [AbacusOrderType.Deleveraged.rawValue]: null,

  [AbacusOrderType.FinalSettlement.name]: null,
  [AbacusOrderType.FinalSettlement.rawValue]: null,
};

export const MARGIN_MODE_STRINGS: Record<string, string> = {
  [AbacusMarginMode.Cross.name]: STRING_KEYS.CROSS,
  [AbacusMarginMode.Cross.rawValue]: STRING_KEYS.CROSS,
  [AbacusMarginMode.Isolated.name]: STRING_KEYS.ISOLATED,
  [AbacusMarginMode.Isolated.rawValue]: STRING_KEYS.ISOLATED,
};

// Custom types involving Abacus

export type NetworkConfig = Partial<{
  indexerUrl: Nullable<string>;
  websocketUrl: Nullable<string>;
  validatorUrl: Nullable<string>;
  chainId: Nullable<string>;
  faucetUrl: Nullable<string>;
  USDC_DENOM: Nullable<string>;
  USDC_DECIMALS: Nullable<number>;
  USDC_GAS_DENOM: Nullable<string>;
  CHAINTOKEN_DENOM: Nullable<string>;
  CHAINTOKEN_DECIMALS: Nullable<number>;
}>;

export type ConnectNetworkEvent = CustomEvent<Partial<NetworkConfig>>;

export type PerpetualMarketOrderbookLevel = OrderbookLine & {
  side?: 'ask' | 'bid';
  mine: number | undefined;
  key: string;
};

export enum AbacusInputTypes {
  AdjustIsolatedMargin = 'adjustIsolatedMargin',
  ClosePosition = 'closePosition',
  Transfer = 'transfer',
  Trade = 'trade',
  TriggerOrders = 'triggerOrders',
}
