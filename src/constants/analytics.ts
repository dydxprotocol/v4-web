import type { SupportedLocales } from './localization';
import type { DydxNetwork } from './networks';
import type { OnboardingState, OnboardingSteps } from './account';
import type { DydxAddress, WalletType, WalletConnectionType, EvmAddress } from './wallets';
import type { DialogTypes } from './dialogs';
import type { TradeTypes } from './trade';
import type { AbacusApiStatus, HumanReadablePlaceOrderPayload } from './abacus';

// User properties
export enum AnalyticsUserProperty {
  // Environment
  Locale = 'selectedLocale',
  Breakpoint = 'breakpoint',

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

  // Trading
  TradeOrderTypeSelected = 'TradeOrderTypeSelected',
  TradePlaceOrder = 'TradePlaceOrder',
  TradePlaceOrderConfirmed = 'TradePlaceOrderConfirmed',
  TradeCancelOrder = 'TradeCancelOrder',
  TradeCancelOrderConfirmed = 'TradeCancelOrderConfirmed',
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
    ? {}
    : T extends AnalyticsEvent.TransferWithdraw
    ? {}
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
    : T extends AnalyticsEvent.TradeCancelOrderConfirmed
    ? {
        /** roundtrip time between user canceling an order and confirmation from indexer (client → validator → indexer → client) */
        roundtripMs: number;
        /** URL/IP of node the order was sent to */
        validatorUrl: string;
      }
    : never;
