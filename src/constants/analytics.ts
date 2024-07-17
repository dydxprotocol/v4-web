import { StatSigFlags } from '@/types/statsig';
import { SupportedLocale } from '@dydxprotocol/v4-localization';
import { RecordOf, TagsOf, UnionOf, ofType, unionize } from 'unionize';

import type { AbacusApiStatus, HumanReadablePlaceOrderPayload } from './abacus';
import type { OnboardingState, OnboardingSteps } from './account';
import { DialogTypesTypes } from './dialogs';
import type { SupportedLocales } from './localization';
import type { DydxNetwork } from './networks';
import { TransferNotificationTypes } from './notifications';
import type { TradeTypes } from './trade';
import type { DydxAddress, EvmAddress, WalletConnectionType, WalletType } from './wallets';

export type AnalyticsEventTrackMeta<T extends AnalyticsEventTypes> = {
  detail: {
    eventType: T;
    eventData: AnalyticsEventPayloads[T];
  };
};
export type AnalyticsEventIdentifyMeta<T extends AnalyticsUserPropertyTypes> = {
  detail: {
    property: (typeof AnalyticsUserPropertyLoggableTypes)[T];
    propertyValue: AnalyticsUserPropertyPayloads[T];
  };
};

// Do not update. this is used specifically to type how we create custom identify events.
// If you want to update how identify events work, go to src/lib/analytics.ts
export const customIdentifyEvent = <T extends AnalyticsUserPropertyTypes>(
  meta: AnalyticsEventIdentifyMeta<T>
) => {
  return new CustomEvent('dydx:identify', meta);
};

// Do not update. this is used specifically to type how we create custom track events.
// If you want to update how track events work, go to src/lib/analytics.ts
export const customTrackEvent = <T extends AnalyticsEventTypes>(
  meta: AnalyticsEventTrackMeta<T>
) => {
  return new CustomEvent('dydx:track', meta);
};

// User properties
export const AnalyticsUserProperties = unionize(
  {
    // Referrer
    CustomDomainReferrer: ofType<string | null>(),
    // Environment
    Locale: ofType<SupportedLocales>(),
    Breakpoint: ofType<
      'MOBILE' | 'TABLET' | 'DESKTOP_SMALL' | 'DESKTOP_MEDIUM' | 'DESKTOP_LARGE' | 'UNSUPPORTED'
    >(),
    Version: ofType<string | null>(),

    // StatSigFlags
    StatsigFlags: ofType<{ [key in StatSigFlags]?: boolean }>(),

    // Network
    Network: ofType<DydxNetwork>(),

    // Wallet
    WalletType: ofType<WalletType | null>(),
    WalletConnectionType: ofType<WalletConnectionType | null>(),
    WalletAddress: ofType<EvmAddress | DydxAddress | null>(),

    // Account
    DydxAddress: ofType<DydxAddress | null>(),
    SubaccountNumber: ofType<number | null>(),
  },
  { tag: 'type' as const, value: 'payload' as const }
);

export const AnalyticsUserPropertyLoggableTypes = {
  Locale: 'selectedLocale',
  Breakpoint: 'breakpoint',
  Version: 'version',
  StatsigFlags: 'statsigFlags',
  CustomDomainReferrer: 'customDomainReferrer',
  Network: 'network',
  WalletType: 'walletType',
  WalletConnectionType: 'walletConnectionType',
  WalletAddress: 'walletAddress',
  DydxAddress: 'dydxAddress',
  SubaccountNumber: 'subaccountNumber',
} as const satisfies Record<AnalyticsUserPropertyTypes, string>;

export type AnalyticsUserProperty = UnionOf<typeof AnalyticsUserProperties>;
export type AnalyticsUserPropertyTypes = TagsOf<typeof AnalyticsUserProperties>;
export type AnalyticsUserPropertyPayloads = RecordOf<typeof AnalyticsUserProperties>;

export const AnalyticsEvents = unionize(
  {
    // App
    AppStart: ofType<{}>(),
    NetworkStatus: ofType<{
      status: (typeof AbacusApiStatus)['name'];
      /** Last time indexer node was queried successfully */
      lastSuccessfulIndexerRpcQuery?: number;
      /** Time elapsed since indexer node was queried successfully */
      elapsedTime?: number;
      blockHeight?: number;
      indexerBlockHeight?: number;
      trailingBlocks?: number;
    }>(),
    SwitchedLanguageToEULanguage: ofType<{
      previousLocale: SupportedLocale;
      newLocale: SupportedLocale;
      browserLanguage?: string;
    }>(),

    // Export CSV
    ExportCsvClick: ofType<{}>(),
    ExportDownloadClick: ofType<{
      trades: boolean;
      transfers: boolean;
    }>(),
    ExportTradesCheckboxClick: ofType<{
      value: boolean;
    }>(),
    ExportTransfersCheckboxClick: ofType<{
      value: boolean;
    }>(),

    // Navigation
    NavigatePage: ofType<{
      path: string;
    }>(),
    NavigateDialog: ofType<{
      type: DialogTypesTypes;
    }>(),
    NavigateDialogClose: ofType<{
      type: DialogTypesTypes;
    }>(),
    NavigateExternal: ofType<{
      link: string;
    }>(),

    // Wallet
    ConnectWallet: ofType<{
      walletType: WalletType;
      walletConnectionType: WalletConnectionType;
    }>(),
    DisconnectWallet: ofType<{}>(),

    // Onboarding
    OnboardingStepChanged: ofType<{
      state: OnboardingState;
      step?: OnboardingSteps;
    }>(),
    OnboardingAccountDerived: ofType<{
      hasPreviousTransactions: boolean;
    }>(),
    OnboardingWalletIsNonDeterministic: ofType<{}>(),

    // Transfers
    TransferFaucet: ofType<{}>(),
    TransferFaucetConfirmed: ofType<{
      /** roundtrip time between user placing an order and confirmation from indexer (client → validator → indexer → client) */
      roundtripMs: number;
      /** URL/IP of node the order was sent to */
      validatorUrl: string;
    }>(),
    TransferDeposit: ofType<{
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
    }>(),
    TransferWithdraw: ofType<{
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
    }>(),
    TransferNotification: ofType<{
      type: TransferNotificationTypes | undefined;
      toAmount: number | undefined;
      timeSpent: Record<string, number> | number | undefined;
      txHash: string;
      status: 'new' | 'success' | 'error';
      triggeredAt: number | undefined;
    }>(),

    // Trading
    TradeOrderTypeSelected: ofType<{
      type: TradeTypes;
    }>(),
    TradePlaceOrder: ofType<
      HumanReadablePlaceOrderPayload & {
        isClosePosition: boolean;
      }
    >(),
    TradePlaceOrderConfirmed: ofType<{
      /** roundtrip time between user placing an order and confirmation from indexer (client → validator → indexer → client) */
      roundtripMs: number;
      /** URL/IP of node the order was sent to */
      validatorUrl: string;
    }>(),
    TradeCancelOrder: ofType<{}>(),
    TradeCancelOrderConfirmed: ofType<{
      /** roundtrip time between user canceling an order and confirmation from indexer (client → validator → indexer → client) */
      roundtripMs: number;
      /** URL/IP of node the order was sent to */
      validatorUrl: string;
    }>(),

    // Notification
    NotificationAction: ofType<{
      type: string;
      id: string;
    }>(),

    // Staking
    StakeTransaction: ofType<{
      txHash?: string;
      amount?: number;
      validatorAddress?: string;
      defaultValidatorAddress?: string;
    }>(),
    UnstakeTransaction: ofType<{
      txHash?: string;
      amount?: number;
      validatorAddresses?: string[];
    }>(),
    ClaimTransaction: ofType<{
      txHash?: string;
      amount?: string;
    }>(),
    StakeInput: ofType<{
      amount?: number;
      validatorAddress?: string;
    }>(),
    UnstakeInput: ofType<{
      amount?: number;
      validatorAddress?: string;
    }>(),

    // Sharing
    SharePnlShared: ofType<{
      asset: string;
    }>(),
    SharePnlCopied: ofType<{
      asset: string;
    }>(),

    Error: ofType<{
      location: string;
      error: Error;
      metadata?: any;
    }>(),
    RouteError: ofType<{
      transferType?: 'withdrawal' | 'deposit';
      errorMessage?: string;
      amount: string;
      chainId?: string;
      assetId?: string;
    }>(),
  },
  { tag: 'type' as const, value: 'payload' as const }
);
export type AnalyticsEvent = UnionOf<typeof AnalyticsEvents>;
export type AnalyticsEventTypes = TagsOf<typeof AnalyticsEvents>;
export type AnalyticsEventPayloads = RecordOf<typeof AnalyticsEvents>;

export const DEFAULT_TRANSACTION_MEMO = 'dYdX Frontend (web)';
export const lastSuccessfulRestRequestByOrigin: Record<URL['origin'], number> = {};
export const lastSuccessfulWebsocketRequestByOrigin: Record<URL['origin'], number> = {};
