import type { AbacusApiStatus, HumanReadablePlaceOrderPayload } from './abacus';
import type { OnboardingState, OnboardingSteps } from './account';
import type { DialogTypes } from './dialogs';
import type { SupportedLocales } from './localization';
import type { DydxNetwork } from './networks';
import { TransferNotificationTypes } from './notifications';
import type { TradeTypes } from './trade';
import type { DydxAddress, EvmAddress, WalletConnectionType, WalletType } from './wallets';

type AnalyticsEventDataWithReferrer<T extends AnalyticsEvent> = AnalyticsEventData<T> & {
  referrer: string;
};
export type AnalyticsEventTrackMeta<T extends AnalyticsEvent> = {
  detail: {
    eventType: AnalyticsEvent;
    eventData: AnalyticsEventDataWithReferrer<T>;
  };
};
export type AnalyticsEventIdentifyMeta<T extends AnalyticsUserProperty> = {
  detail: {
    property: AnalyticsUserProperty;
    propertyValue: AnalyticsUserPropertyValue<T>;
  };
};

// Do not update. this is used specifically to type how we create custom identify events.
// If you want to update how identify events work, go to src/lib/analytics.ts
export const customIdentifyEvent = <T extends AnalyticsUserProperty>(
  meta: AnalyticsEventIdentifyMeta<T>
) => {
  return new CustomEvent('dydx:identify', meta);
};

// Do not update. this is used specifically to type how we create custom track events.
// If you want to update how track events work, go to src/lib/analytics.ts
export const customTrackEvent = <T extends AnalyticsEvent>(meta: AnalyticsEventTrackMeta<T>) => {
  return new CustomEvent('dydx:track', meta);
};

// User properties
export enum AnalyticsUserProperty {
  // Environment
  Locale = 'selectedLocale',
  Breakpoint = 'breakpoint',
  Version = 'version',

  // Network
  Network = 'network',

  // Wallet
  WalletType = 'walletType',
  WalletConnectionType = 'walletConnectionType',
  WalletAddress = 'walletAddress',

  // Account
  DydxAddress = 'dydxAddress',
  SubaccountNumber = 'subaccountNumber',
}

export type AnalyticsUserPropertyValue<T extends AnalyticsUserProperty> =
  // Environment
  T extends AnalyticsUserProperty.Breakpoint
    ? 'MOBILE' | 'TABLET' | 'DESKTOP_SMALL' | 'DESKTOP_MEDIUM' | 'DESKTOP_LARGE' | 'UNSUPPORTED'
    : T extends AnalyticsUserProperty.Locale
      ? SupportedLocales
      : T extends AnalyticsUserProperty.Version
        ? string | undefined
        : // Network
          T extends AnalyticsUserProperty.Network
          ? DydxNetwork
          : // Wallet
            T extends AnalyticsUserProperty.WalletType
            ? WalletType | undefined
            : T extends AnalyticsUserProperty.WalletConnectionType
              ? WalletConnectionType | undefined
              : T extends AnalyticsUserProperty.WalletAddress
                ? EvmAddress | DydxAddress | undefined
                : // Account
                  T extends AnalyticsUserProperty.DydxAddress
                  ? DydxAddress | undefined
                  : T extends AnalyticsUserProperty.SubaccountNumber
                    ? number | undefined
                    : undefined;

// Events
export enum AnalyticsEvent {
  // App
  AppStart = 'AppStart',
  NetworkStatus = 'NetworkStatus',

  // Navigation
  NavigatePage = 'NavigatePage',
  NavigateDialog = 'NavigateDialog',
  NavigateDialogClose = 'NavigateDialogClose',
  NavigateExternal = 'NavigateExternal',

  // Wallet
  ConnectWallet = 'ConnectWallet',
  DisconnectWallet = 'DisconnectWallet',

  // Onboarding
  OnboardingStepChanged = 'OnboardingStepChanged',
  OnboardingAccountDerived = 'OnboardingAccountDerived',
  OnboardingWalletIsNonDeterministic = 'OnboardingWalletIsNonDeterministic',

  // Transfers
  TransferFaucet = 'TransferFaucet',
  TransferFaucetConfirmed = 'TransferFaucetConfirmed',
  TransferDeposit = 'TransferDeposit',
  TransferWithdraw = 'TransferWithdraw',
  TransferNotification = 'TransferNotification',

  // Trading
  TradeOrderTypeSelected = 'TradeOrderTypeSelected',
  TradePlaceOrder = 'TradePlaceOrder',
  TradePlaceOrderConfirmed = 'TradePlaceOrderConfirmed',
  TradeCancelOrder = 'TradeCancelOrder',
  TradeCancelOrderConfirmed = 'TradeCancelOrderConfirmed',

  // Notification
  NotificationAction = 'NotificationAction',

  // Staking
  StakeTransaction = 'StakeTransaction',
  UnstakeTransaction = 'UnstakeTransaction',
  StakeInput = 'StakeInput',
  UnstakeInput = 'UnstakeInput',
  ClaimTransaction = 'ClaimTransaction',
}

type AnalyticsEventDataMap = {
  [AnalyticsEvent.AppStart]: {};
  [AnalyticsEvent.NetworkStatus]: {
    status: (typeof AbacusApiStatus)['name'];
    lastSuccessfulIndexerRpcQuery?: number;
    elapsedTime?: number;
    blockHeight?: number;
    indexerBlockHeight?: number;
    trailingBlocks?: number;
  };
  [AnalyticsEvent.NavigatePage]: { path: string };
  [AnalyticsEvent.NavigateDialog]: { type: DialogTypes };
  [AnalyticsEvent.NavigateDialogClose]: { type: DialogTypes };
  [AnalyticsEvent.NavigateExternal]: { link: string };
  [AnalyticsEvent.ConnectWallet]: {
    walletType: WalletType;
    walletConnectionType: WalletConnectionType;
  };
  [AnalyticsEvent.DisconnectWallet]: {};
  [AnalyticsEvent.OnboardingStepChanged]: {
    state: OnboardingState;
    step?: OnboardingSteps;
  };
  [AnalyticsEvent.OnboardingAccountDerived]: {
    hasPreviousTransactions: boolean;
  };
  [AnalyticsEvent.TransferFaucet]: {};
  [AnalyticsEvent.TransferFaucetConfirmed]: {
    roundtripMs: number;
    validatorUrl: string;
  };
  [AnalyticsEvent.TransferDeposit]: {
    chainId?: string;
    tokenAddress?: string;
    tokenSymbol?: string;
    slippage?: number;
    gasFee?: number;
    bridgeFee?: number;
    exchangeRate?: number;
    estimatedRouteDuration?: number;
    toAmount?: number;
    toAmountMin?: number;
  };
  [AnalyticsEvent.TransferWithdraw]: {
    chainId?: string;
    tokenAddress?: string;
    tokenSymbol?: string;
    slippage?: number;
    gasFee?: number;
    bridgeFee?: number;
    exchangeRate?: number;
    estimatedRouteDuration?: number;
    toAmount?: number;
    toAmountMin?: number;
  };
  [AnalyticsEvent.TradeOrderTypeSelected]: { type: TradeTypes };
  [AnalyticsEvent.TradePlaceOrder]: HumanReadablePlaceOrderPayload & {
    isClosePosition: boolean;
  };
  [AnalyticsEvent.TradePlaceOrderConfirmed]: {
    roundtripMs: number;
    validatorUrl: string;
  };
  [AnalyticsEvent.TradeCancelOrder]: {};
  [AnalyticsEvent.TradeCancelOrderConfirmed]: {
    roundtripMs: number;
    validatorUrl: string;
  };
  [AnalyticsEvent.NotificationAction]: {
    type: string;
    id: string;
  };
  [AnalyticsEvent.TransferNotification]: {
    type: TransferNotificationTypes | undefined;
    toAmount: number | undefined;
    timeSpent: Record<string, number> | number | undefined;
    txHash: string;
    status: 'new' | 'success' | 'error';
    triggeredAt: number | undefined;
  };
  [AnalyticsEvent.StakeTransaction]: {
    txHash?: string;
    amount?: number;
    validatorAddress?: string;
  };
  [AnalyticsEvent.UnstakeTransaction]: {
    txHash?: string;
    amount?: number;
    validatorAddresses?: string[];
  };
  [AnalyticsEvent.ClaimTransaction]: {
    txHash?: string;
    amount?: string;
  };
  [AnalyticsEvent.StakeInput]: {
    amount?: number;
    validatorAddress?: string;
  };
  [AnalyticsEvent.UnstakeInput]: {
    amount?: number;
    validatorAddress?: string;
  };
};

export type AnalyticsEventData<T extends AnalyticsEvent> = T extends keyof AnalyticsEventDataMap
  ? AnalyticsEventDataMap[T]
  : never;

export const DEFAULT_TRANSACTION_MEMO = 'dYdX Frontend (web)';
export const lastSuccessfulRestRequestByOrigin: Record<URL['origin'], number> = {};
export const lastSuccessfulWebsocketRequestByOrigin: Record<URL['origin'], number> = {};
