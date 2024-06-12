import { RecordOf, UnionOf, ofType, unionize } from 'unionize';

import type { AbacusApiStatus, HumanReadablePlaceOrderPayload } from './abacus';
import type { OnboardingState, OnboardingSteps } from './account';
import { DialogTypesTypes } from './dialogs';
import type { SupportedLocales } from './localization';
import type { DydxNetwork } from './networks';
import { TransferNotificationTypes } from './notifications';
import type { TradeTypes } from './trade';
import type { DydxAddress, EvmAddress, WalletConnectionType, WalletType } from './wallets';

// Do not update. this is used specifically to type how we create custom identify events.
// If you want to update how identify events work, go to src/lib/analytics.ts
export const customIdentifyEvent = (meta: AnalyticsUserProperty) => {
  return new CustomEvent('dydx:identify', {
    detail: { property: meta.type, propertyValue: meta.payload },
  });
};

// Do not update. this is used specifically to type how we create custom track events.
// If you want to update how track events work, go to src/lib/analytics.ts
export const customTrackEvent = (meta: AnalyticsEvent, referrer: string) => {
  return new CustomEvent('dydx:track', {
    detail: { eventType: meta.type, eventData: { ...meta.payload, referrer } },
  });
};

// User properties
export const AnalyticsUserProperties = unionize(
  {
    // Environment
    Locale: ofType<SupportedLocales>(),
    Breakpoint: ofType<
      'MOBILE' | 'TABLET' | 'DESKTOP_SMALL' | 'DESKTOP_MEDIUM' | 'DESKTOP_LARGE' | 'UNSUPPORTED'
    >(),
    Version: ofType<string | null>(),

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

export type AnalyticsUserProperty = UnionOf<typeof AnalyticsUserProperties>;

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
  },
  { tag: 'type' as const, value: 'payload' as const }
);
// export type AnalyticsEvent = (typeof AnalyticsEvents)['_Union'];
export type AnalyticsEvent = UnionOf<typeof AnalyticsEvents>;
export type AnalyticsEventArgTypes = RecordOf<typeof AnalyticsEvents>;

export const DEFAULT_TRANSACTION_MEMO = 'dYdX Frontend (web)';
export const lastSuccessfulRestRequestByOrigin: Record<URL['origin'], number> = {};
export const lastSuccessfulWebsocketRequestByOrigin: Record<URL['origin'], number> = {};
