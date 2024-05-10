import type { AbacusApiStatus, HumanReadablePlaceOrderPayload } from './abacus';
import type { OnboardingState, OnboardingSteps } from './account';
import type { DialogTypes } from './dialogs';
import type { SupportedLocales } from './localization';
import type { DydxNetwork } from './networks';
import type { TradeTypes } from './trade';
import type { DydxAddress, EvmAddress, WalletConnectionType, WalletType } from './wallets';

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
  TransferNotification = 'TransferNotification',
  TransferWithdraw = 'TransferWithdraw',
  TransferStep = 'TransferStep',

  // Trading
  TradeOrderTypeSelected = 'TradeOrderTypeSelected',
  TradePlaceOrder = 'TradePlaceOrder',
  TradePlaceOrderConfirmed = 'TradePlaceOrderConfirmed',
  TradeCancelOrder = 'TradeCancelOrder',
  TradeCancelOrderConfirmed = 'TradeCancelOrderConfirmed',

  // Notification
  NotificationAction = 'NotificationAction',

  // SquidStatus
  SquidRouteError = 'SquidRouteError',
}

export type AnalyticsEventData<T extends AnalyticsEvent> =
  // App
  T extends AnalyticsEvent.AppStart
    ? {}
    : T extends AnalyticsEvent.NetworkStatus
    ? {
        status: (typeof AbacusApiStatus)['name'];
        /** Last time indexer node was queried successfully */
        lastSuccessfulIndexerRpcQuery?: number;
        /** Time elapsed since indexer node was queried successfully */
        elapsedTime?: number;
        blockHeight?: number;
        indexerBlockHeight?: number;
        trailingBlocks?: number;
      }
    : // Navigation
    T extends AnalyticsEvent.NavigatePage
    ? {
        path: string;
      }
    : T extends AnalyticsEvent.NavigateDialog
    ? {
        type: DialogTypes;
      }
    : T extends AnalyticsEvent.NavigateDialogClose
    ? {
        type: DialogTypes;
      }
    : T extends AnalyticsEvent.NavigateExternal
    ? {
        link: string;
      }
    : // Wallet
    T extends AnalyticsEvent.ConnectWallet
    ? {
        walletType: WalletType;
        walletConnectionType: WalletConnectionType;
      }
    : T extends AnalyticsEvent.DisconnectWallet
    ? {}
    : // Onboarding
    T extends AnalyticsEvent.OnboardingStepChanged
    ? {
        state: OnboardingState;
        step?: OnboardingSteps;
      }
    : T extends AnalyticsEvent.OnboardingAccountDerived
    ? {
        hasPreviousTransactions: boolean;
      }
    : // Transfers
    T extends AnalyticsEvent.TransferFaucet
    ? {}
    : T extends AnalyticsEvent.TransferFaucetConfirmed
    ? {
        /** roundtrip time between user placing an order and confirmation from indexer (client → validator → indexer → client) */
        roundtripMs: number;
        /** URL/IP of node the order was sent to */
        validatorUrl: string;
      }
    : T extends AnalyticsEvent.TransferDeposit
    ? {
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
      }
    : T extends AnalyticsEvent.TransferWithdraw
    ? {
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
      }
    : // Trading
    T extends AnalyticsEvent.TradeOrderTypeSelected
    ? {
        type: TradeTypes;
      }
    : T extends AnalyticsEvent.TradePlaceOrder
    ? HumanReadablePlaceOrderPayload & {
        isClosePosition: boolean;
      }
    : T extends AnalyticsEvent.TradePlaceOrderConfirmed
    ? {
        /** roundtrip time between user placing an order and confirmation from indexer (client → validator → indexer → client) */
        roundtripMs: number;
        /** URL/IP of node the order was sent to */
        validatorUrl: string;
      }
    : T extends AnalyticsEvent.TradeCancelOrder
    ? {}
    : T extends AnalyticsEvent.TradeCancelOrderConfirmed
    ? {
        /** roundtrip time between user canceling an order and confirmation from indexer (client → validator → indexer → client) */
        roundtripMs: number;
        /** URL/IP of node the order was sent to */
        validatorUrl: string;
      }
    : // Notifcation
    T extends AnalyticsEvent.NotificationAction
    ? {
        type: string;
        id: string;
      }
    : T extends AnalyticsEvent.TransferNotification
    ? {
        type: string;
        complete: boolean;
      }
    : T extends AnalyticsEvent.TransferStep
    ? {
        step: string;
        type: string;
        link: string | undefined;
        time: Record<string, number> | undefined;
        amount: number | undefined;
      }
    : T extends AnalyticsEvent.SquidRouteError
    ? {
        type: DialogTypes;
        errorMessage: string | undefined;
      }
    : never;

export const DEFAULT_TRANSACTION_MEMO = 'dYdX Frontend (web)';
