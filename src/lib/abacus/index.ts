// eslint-disable-next-line import/no-cycle
import type { LocalWallet, SelectedGasDenom } from '@dydxprotocol/v4-client-js';

import type {
  AbacusStateNotificationProtocol,
  AdjustIsolatedMarginInputFields,
  ClosePositionInputFields,
  HistoricalPnlPeriods,
  HistoricalTradingRewardsPeriod,
  HistoricalTradingRewardsPeriods,
  HumanReadableCancelOrderPayload,
  HumanReadableCloseAllPositionsPayload,
  HumanReadablePlaceOrderPayload,
  HumanReadableSubaccountTransferPayload,
  Nullable,
  OrderbookGroupings,
  ParsingError,
  TradeInputFields,
  TransferInputFields,
  TriggerOrdersInputFields,
} from '@/constants/abacus';
import {
  AbacusAppConfig,
  AbacusHelper,
  AbacusWalletConnectionType,
  AdjustIsolatedMarginInputField,
  ApiData,
  AsyncAbacusStateManager,
  ClosePositionInputField,
  CoroutineTimer,
  HistoricalPnlPeriod,
  IOImplementations,
  StatsigConfig,
  TradeInputField,
  TransferInputField,
  TransferType,
  UIImplementations,
} from '@/constants/abacus';
import { Hdkey } from '@/constants/account';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { CURRENT_ABACUS_DEPLOYMENT, type DydxNetwork } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';
import {
  CLEARED_CLOSE_POSITION_INPUTS,
  CLEARED_SIZE_INPUTS,
  CLEARED_TRADE_INPUTS,
} from '@/constants/trade';
import { ConnectorType, WalletInfo } from '@/constants/wallets';

import { type RootStore } from '@/state/_store';
import { setClosePositionFormInputs, setTradeFormInputs } from '@/state/inputs';
import { getTransferInputs } from '@/state/inputsSelectors';

import { assertNever } from '../assertNever';
import { LocaleSeparators } from '../numbers';
import { testFlags } from '../testFlags';
import AbacusAnalytics from './analytics';
import AbacusChainTransaction from './dydxChainTransactions';
import AbacusFileSystem from './filesystem';
import AbacusFormatter from './formatter';
import AbacusLocalizer from './localizer';
import AbacusLogger from './logger';
import AbacusRest from './rest';
import AbacusStateNotifier, { NoOpAbacusStateNotifier } from './stateNotification';
import AbacusThreading from './threading';
import AbacusWebsocket from './websocket';

type AbacusInputValue = string | number | boolean | null | undefined;
function abacusValueToString(val: AbacusInputValue): Nullable<string> {
  if (val == null) {
    return val;
  }
  if (typeof val === 'number') {
    return val.toString();
  }
  if (typeof val === 'string') {
    return val;
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  assertNever(val);
  return val?.toString() ?? '';
}

class AbacusStateManager {
  private store: RootStore | undefined;

  private currentMarket: string | undefined;

  stateManager: InstanceType<typeof AsyncAbacusStateManager>;

  websocket: AbacusWebsocket;

  stateNotifier: AbacusStateNotificationProtocol & { setStore: (store: RootStore) => void };

  analytics: AbacusAnalytics;

  abacusFormatter: AbacusFormatter;

  chainTransactions: AbacusChainTransaction;

  constructor() {
    this.store = undefined;
    this.currentMarket = undefined;
    this.stateNotifier = testFlags.disableAbacus
      ? new NoOpAbacusStateNotifier()
      : new AbacusStateNotifier();
    this.analytics = new AbacusAnalytics();
    this.websocket = new AbacusWebsocket();
    this.abacusFormatter = new AbacusFormatter();
    this.chainTransactions = new AbacusChainTransaction();

    const ioImplementations = new IOImplementations(
      // @ts-ignore
      new AbacusRest(),
      this.websocket,
      this.chainTransactions,
      this.analytics,
      new AbacusThreading(),
      new CoroutineTimer(),
      new AbacusFileSystem(),
      new AbacusLogger()
    );

    const uiImplementations = new UIImplementations(
      // @ts-ignore
      new AbacusLocalizer(),
      this.abacusFormatter
    );

    const appConfigs = AbacusAppConfig.Companion.forWebAppWithIsolatedMargins;
    appConfigs.staticTyping = true;
    appConfigs.metadataService = true;

    this.stateManager = new AsyncAbacusStateManager(
      '',
      CURRENT_ABACUS_DEPLOYMENT,
      appConfigs,
      ioImplementations,
      uiImplementations,
      // @ts-ignore
      this.stateNotifier
    );
  }

  start = ({ network }: { network?: DydxNetwork } = {}) => {
    if (testFlags.disableAbacus) return;
    if (network) {
      this.stateManager.environmentId = network;
    }
    this.stateManager.readyToConnect = true;
    this.setMarket(this.currentMarket ?? DEFAULT_MARKETID);
    this.stateManager.trade(null, null);
  };

  restart = ({ network }: { network?: DydxNetwork } = {}) => {
    if (testFlags.disableAbacus) return;
    this.stateManager.readyToConnect = false;
    this.start({ network });
  };

  // ------ Breakdown ------ //
  disconnectAccount = () => {
    this.stateManager.accountAddress = null;
    this.chainTransactions.clearAccounts();
  };

  attemptDisconnectAccount = () => {
    const state = this.store?.getState();
    const { type: transferType } = (state && getTransferInputs(state)) ?? {};
    // we don't want to disconnect the account if we switch network during the deposit form
    if (transferType?.rawValue !== TransferType.deposit.rawValue) {
      this.disconnectAccount();
    }
  };

  // ------ Input Values ------ //
  clearTradeInputValues = ({ shouldResetSize }: { shouldResetSize?: boolean } = {}) => {
    this.setTradeValue({ value: null, field: TradeInputField.trailingPercent });
    this.setTradeValue({ value: null, field: TradeInputField.triggerPrice });
    this.setTradeValue({ value: null, field: TradeInputField.limitPrice });

    this.store?.dispatch(setTradeFormInputs(CLEARED_TRADE_INPUTS));

    if (shouldResetSize) {
      this.clearTradeInputSizeValues();
    }
  };

  clearTradeInputSizeValues = () => {
    this.setTradeValue({ value: null, field: TradeInputField.size });
    this.setTradeValue({ value: null, field: TradeInputField.usdcSize });
    this.setTradeValue({ value: null, field: TradeInputField.balancePercent });

    this.setTradeValue({ value: null, field: TradeInputField.leverage });
    this.setTradeValue({ value: null, field: TradeInputField.targetLeverage });

    this.store?.dispatch(setTradeFormInputs(CLEARED_SIZE_INPUTS));
  };

  clearClosePositionInputValues = ({
    shouldFocusOnTradeInput,
  }: {
    shouldFocusOnTradeInput?: boolean;
  } = {}) => {
    this.store?.dispatch(setClosePositionFormInputs(CLEARED_CLOSE_POSITION_INPUTS));
    this.setClosePositionValue({ value: null, field: ClosePositionInputField.percent });
    this.setClosePositionValue({ value: null, field: ClosePositionInputField.size });
    this.setClosePositionValue({ value: null, field: ClosePositionInputField.limitPrice });
    this.setClosePositionValue({ value: false, field: ClosePositionInputField.useLimit });

    if (shouldFocusOnTradeInput) {
      this.clearTradeInputValues({ shouldResetSize: true });
    }
  };

  clearTransferInputValues = () => {
    this.setTransferValue({ value: null, field: TransferInputField.address });
    this.setTransferValue({ value: null, field: TransferInputField.size });
    this.setTransferValue({ value: null, field: TransferInputField.usdcSize });
    this.setTransferValue({ value: null, field: TransferInputField.MEMO });
  };

  clearAdjustIsolatedMarginInputValues = () => {
    this.setAdjustIsolatedMarginValue({
      value: null,
      field: AdjustIsolatedMarginInputField.Amount,
    });
    this.setAdjustIsolatedMarginValue({
      value: null,
      field: AdjustIsolatedMarginInputField.AmountPercent,
    });
  };

  resetInputState = () => {
    this.clearTransferInputValues();
    this.setTransferValue({
      field: TransferInputField.type,
      value: null,
    });
    this.clearAdjustIsolatedMarginInputValues();
    this.clearTradeInputValues({ shouldResetSize: true });
  };

  // ------ Set Data ------ //
  setStore = (store: RootStore) => {
    this.store = store;
    this.stateNotifier.setStore(store);
    this.chainTransactions.setStore(store);
  };

  setAccount = (localWallet?: LocalWallet, hdkey?: Hdkey, connectedWallet?: WalletInfo) => {
    if (localWallet) {
      this.stateManager.accountAddress = localWallet.address;
      this.chainTransactions.setLocalWallet(localWallet);
      if (connectedWallet?.connectorType === ConnectorType.Cosmos) {
        this.stateManager.walletConnectionType = AbacusWalletConnectionType.Cosmos;
      } else if (connectedWallet?.connectorType === ConnectorType.PhantomSolana) {
        this.stateManager.walletConnectionType = AbacusWalletConnectionType.Solana;
      } else {
        this.stateManager.walletConnectionType = AbacusWalletConnectionType.Ethereum;
      }
    }
  };

  setNobleWallet = (nobleWallet?: LocalWallet) => {
    if (nobleWallet) {
      this.chainTransactions.setNobleWallet(nobleWallet);
    }
  };

  setTransfersSourceAddress = (evmAddress: string) => {
    this.stateManager.sourceAddress = evmAddress;
  };

  setSubaccountNumber = (subaccountNumber: number) =>
    (this.stateManager.subaccountNumber = subaccountNumber);

  setMarket = (marketId: string) => {
    this.currentMarket = marketId;
    this.clearTradeInputValues({ shouldResetSize: true });
    this.stateManager.market = marketId;
  };

  setSelectedGasDenom = (denom: SelectedGasDenom) => {
    this.chainTransactions.setSelectedGasDenom(denom);
  };

  setTradeValue = ({
    value,
    field,
  }: {
    value: AbacusInputValue;
    field: Nullable<TradeInputFields>;
  }) => {
    this.stateManager.trade(abacusValueToString(value), field);
  };

  setAdjustIsolatedMarginValue = ({
    value,
    field,
  }: {
    value: AbacusInputValue;
    field: AdjustIsolatedMarginInputFields;
  }) => {
    this.stateManager.adjustIsolatedMargin(abacusValueToString(value), field);
  };

  setTransferValue = ({
    value,
    field,
  }: {
    value: AbacusInputValue;
    field: TransferInputFields;
  }) => {
    this.stateManager.transfer(abacusValueToString(value), field);
  };

  setTriggerOrdersValue = ({
    value,
    field,
  }: {
    value: AbacusInputValue;
    field: TriggerOrdersInputFields;
  }) => {
    this.stateManager.triggerOrders(abacusValueToString(value), field);
  };

  setHistoricalPnlPeriod = (
    period: (typeof HistoricalPnlPeriod)[keyof typeof HistoricalPnlPeriod]
  ) => {
    this.stateManager.historicalPnlPeriod = period;
  };

  setHistoricalTradingRewardPeriod = (
    period: (typeof HistoricalTradingRewardsPeriod)[keyof typeof HistoricalTradingRewardsPeriod]
  ) => {
    this.stateManager.historicalTradingRewardPeriod = period;
  };

  refreshHistoricalTradingRewards = () =>
    this.stateManager.refresh(ApiData.HISTORICAL_TRADING_REWARDS);

  switchNetwork = (network: DydxNetwork) => {
    this.stateManager.environmentId = network;

    if (this.currentMarket) {
      this.setMarket(this.currentMarket);
    }
  };

  setClosePositionValue = ({
    value,
    field,
  }: {
    value: AbacusInputValue;
    field: ClosePositionInputFields;
  }) => {
    this.stateManager.closePosition(abacusValueToString(value), field);
  };

  setLocaleSeparators = ({ group, decimal }: LocaleSeparators) => {
    this.abacusFormatter.setLocaleSeparators({ group, decimal });
  };

  // ------ Transactions ------ //

  placeOrder = (
    callback: (
      success: boolean,
      parsingError: Nullable<ParsingError>,
      data: Nullable<HumanReadablePlaceOrderPayload>
    ) => void
  ): Nullable<HumanReadablePlaceOrderPayload> => this.stateManager.commitPlaceOrder(callback);

  closePosition = (
    callback: (
      success: boolean,
      parsingError: Nullable<ParsingError>,
      data: Nullable<HumanReadablePlaceOrderPayload>
    ) => void
  ): Nullable<HumanReadablePlaceOrderPayload> => this.stateManager.commitClosePosition(callback);

  closeAllPositions = (
    callback: (
      success: boolean,
      parsingError: Nullable<ParsingError>,
      data: Nullable<HumanReadablePlaceOrderPayload>
    ) => void
  ): Nullable<HumanReadableCloseAllPositionsPayload> =>
    this.stateManager.closeAllPositions(callback);

  cancelOrder = (
    orderId: string,
    callback: (
      success: boolean,
      parsingError: Nullable<ParsingError>,
      data: Nullable<HumanReadableCancelOrderPayload>
    ) => void
  ) => this.stateManager.cancelOrder(orderId, callback);

  cancelAllOrders = (
    marketId: Nullable<string>,
    callback: (
      success: boolean,
      parsingError: Nullable<ParsingError>,
      data: Nullable<HumanReadableCancelOrderPayload>
    ) => void
  ) => this.stateManager.cancelAllOrders(marketId, callback);

  getCancelableOrderIds = (marketId: Nullable<string>): string[] =>
    this.stateManager
      .cancelAllOrdersPayload(marketId)
      ?.payloads.toArray()
      .map((p) => p.orderId) ?? [];

  adjustIsolatedMarginOfPosition = (
    callback: (
      success: boolean,
      parsingError: Nullable<ParsingError>,
      data: Nullable<HumanReadableSubaccountTransferPayload>
    ) => void
  ): Nullable<HumanReadableSubaccountTransferPayload> =>
    this.stateManager.commitAdjustIsolatedMargin(callback);

  cctpWithdraw = (
    callback: (success: boolean, parsingError: Nullable<ParsingError>, data: string) => void
  ): void => this.stateManager.commitCCTPWithdraw(callback);

  // ------ Utils ------ //
  getHistoricalPnlPeriod = (): Nullable<HistoricalPnlPeriods> =>
    this.stateManager.historicalPnlPeriod;

  getHistoricalTradingRewardPeriod = (): HistoricalTradingRewardsPeriods =>
    this.stateManager.historicalTradingRewardPeriod;

  modifyOrderbookLevel = (grouping: OrderbookGroupings) => {
    this.stateManager.orderbookGrouping = grouping;
  };

  handleCandlesSubscription = ({
    channelId,
    subscribe,
  }: {
    channelId: string;
    subscribe: boolean;
  }) => {
    this.websocket.handleCandlesSubscription({ channelId, subscribe });
  };

  sendSocketRequest = (requestText: string) => {
    this.websocket.send(requestText);
  };

  getChainById = (chainId: string) => {
    return this.stateManager.getChainById(chainId);
  };

  /**
   *
   * Updates Abacus' global StatsigConfig object.
   * You must define the property in abacus first, and then add to the enum.
   *
   */
  setStatsigConfigs = (statsigConfig: { [key in StatsigFlags]?: boolean }) => {
    Object.entries(statsigConfig).forEach(([k, v]) => {
      // This filters out any feature flags in the enum that are not part of the
      // kotlin statsig config object
      if (k in StatsigConfig) {
        // @ts-ignore
        StatsigConfig[k] = v;
      }
    });
  };
}

const abacusStateManager = new AbacusStateManager();

export const abacusHelper = AbacusHelper.Companion;
export default abacusStateManager;
