import type {
  ClosePositionInputFields,
  Nullable,
  HumanReadablePlaceOrderPayload,
  HumanReadableCancelOrderPayload,
  TradeInputFields,
  TransferInputFields,
  HistoricalPnlPeriods,
} from '@/constants/abacus';

import {
  AsyncAbacusStateManager,
  AbacusHelper,
  ClosePositionInputField,
  HistoricalPnlPeriod,
  TradeInputField,
  TransferInputField,
  IOImplementations,
  UIImplementations,
  CoroutineTimer,
} from '@/constants/abacus';

import { DEFAULT_MARKETID } from '@/constants/markets';
import { type DydxNetwork } from '@/constants/networks';

import type { RootStore } from '@/state/_store';

import { getInputTradeOptions } from '@/state/inputsSelectors';

import AbacusRest from './rest';
import AbacusWebsocket from './websocket';
import AbacusChainQuery from './dydxChainQueries';
import AbacusStateNotifier from './stateNotification';
import AbacusLocalizer from './localizer';
import AbacusFormatter from './formatter';
import AbacusThreading from './threading';
import AbacusFileSystem, { ENDPOINTS_PATH } from './filesystem';
import { LocaleSeparators } from '../numbers';
class AbacusStateManager {
  private store: RootStore | undefined;
  private currentMarket: string | undefined;

  stateManager: InstanceType<typeof AsyncAbacusStateManager>;
  websocket: AbacusWebsocket;
  stateNotifier: AbacusStateNotifier;
  abacusFormatter: AbacusFormatter;

  constructor() {
    this.store = undefined;
    this.currentMarket = undefined;
    this.stateNotifier = new AbacusStateNotifier();
    this.websocket = new AbacusWebsocket();
    this.abacusFormatter = new AbacusFormatter();

    const ioImplementations = new IOImplementations(
      // @ts-ignore
      new AbacusRest(),
      this.websocket,
      new AbacusChainQuery(),
      null,
      new AbacusThreading(),
      new CoroutineTimer(),
      new AbacusFileSystem()
    );

    const uiImplementations = new UIImplementations(
      // @ts-ignore
      new AbacusLocalizer(),
      this.abacusFormatter
    );

    this.stateManager = new AsyncAbacusStateManager(
      import.meta.env.SHARED_RESOURCES_URI,
      ENDPOINTS_PATH,
      ioImplementations,
      uiImplementations,
      // @ts-ignore
      this.stateNotifier
    );
  }

  start = ({ network }: { network?: DydxNetwork } = {}) => {
    if (network) {
      this.stateManager.environmentId = network;
    }
    this.stateManager.trade(null, null);
    this.stateManager.readyToConnect = true;
    this.setMarket(this.currentMarket ?? DEFAULT_MARKETID);
  };

  // ------ Breakdown ------ //
  disconnectAccount = () => {
    this.stateManager.accountAddress = null;
  };

  // ------ Input Values ------ //
  clearTradeInputValues = ({ shouldResetSize }: { shouldResetSize?: boolean } = {}) => {
    const state = this.store?.getState();

    const { needsTriggerPrice, needsTrailingPercent, needsLeverage, needsLimitPrice } =
      (state && getInputTradeOptions(state)) || {};

    if (needsTrailingPercent) {
      this.setTradeValue({ value: null, field: TradeInputField.trailingPercent });
    }
    if (needsTriggerPrice) {
      this.setTradeValue({ value: null, field: TradeInputField.triggerPrice });
    }

    if (needsLimitPrice) {
      this.setTradeValue({ value: null, field: TradeInputField.limitPrice });
    }

    if (shouldResetSize) {
      this.setTradeValue({ value: null, field: TradeInputField.size });
      this.setTradeValue({ value: null, field: TradeInputField.usdcSize });

      if (needsLeverage) {
        this.setTradeValue({ value: null, field: TradeInputField.leverage });
      }
    }
  };

  clearClosePositionInputValues = ({
    shouldFocusOnTradeInput,
  }: {
    shouldFocusOnTradeInput?: boolean;
  } = {}) => {
    this.setClosePositionValue({ value: null, field: ClosePositionInputField.percent });
    this.setClosePositionValue({ value: null, field: ClosePositionInputField.size });

    if (shouldFocusOnTradeInput) {
      this.clearTradeInputValues({ shouldResetSize: true });
    }
  };

  clearTransferInputValues = () => {
    this.setTransferValue({ value: null, field: TransferInputField.address });
    this.setTransferValue({ value: null, field: TransferInputField.size });
    this.setTransferValue({ value: null, field: TransferInputField.usdcSize });
  };

  // ------ Set Data ------ //
  setStore = (store: RootStore) => {
    this.stateNotifier.setStore(store);
  };

  setAccount = (walletAddress: string) => {
    this.stateManager.accountAddress = walletAddress;
  };

  setSubaccountNumber = (subaccountNumber: number) =>
    (this.stateManager.subaccountNumber = subaccountNumber);

  setMarket = (marketId: string) => {
    this.currentMarket = marketId;
    this.clearTradeInputValues({ shouldResetSize: true });
    this.stateManager.market = marketId;
  };

  setTradeValue = ({ value, field }: { value: any; field: TradeInputFields }) => {
    this.stateManager.trade(value, field);
  };

  setTransferValue = ({ value, field }: { value: any; field: TransferInputFields }) => {
    this.stateManager.transfer(value, field);
  };

  setHistoricalPnlPeriod = (
    period: (typeof HistoricalPnlPeriod)[keyof typeof HistoricalPnlPeriod]
  ) => {
    this.stateManager.historicalPnlPeriod = period;
  };

  switchNetwork = (network: DydxNetwork) => {
    this.stateManager.environmentId = network;

    if (this.currentMarket) {
      this.setMarket(this.currentMarket);
    }
  };

  setClosePositionValue = ({ value, field }: { value: any; field: ClosePositionInputFields }) => {
    this.stateManager.closePosition(value, field);
  };

  setLocaleSeparators = ({ group, decimal }: LocaleSeparators) => {
    this.abacusFormatter.setLocaleSeparators({ group, decimal });
  };

  // ------ Utils ------ //
  placeOrderPayload = (): Nullable<HumanReadablePlaceOrderPayload> =>
    this.stateManager.placeOrderPayload();

  closePositionPayload = (): Nullable<HumanReadablePlaceOrderPayload> =>
    this.stateManager.closePositionPayload();

  cancelOrderPayload = (orderId: string): Nullable<HumanReadableCancelOrderPayload> =>
    this.stateManager.cancelOrderPayload(orderId);

  getHistoricalPnlPeriod = (): Nullable<HistoricalPnlPeriods> =>
    this.stateManager.historicalPnlPeriod;

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
}

const abacusStateManager = new AbacusStateManager();

export const abacusHelper = AbacusHelper.Companion;
export default abacusStateManager;
