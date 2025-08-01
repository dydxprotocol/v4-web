import { OrderSide, TradeFormType } from '@/bonsai/forms/trade/types';
import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { ApiStatus } from '@/bonsai/types/summaryTypes';
import { type SupportedLocale } from '@dydxprotocol/v4-localization';
import { RouteResponse, UserAddress } from '@skip-go/client';
import { RecordOf, TagsOf, UnionOf, ofType, unionize } from 'unionize';

import { type CustomFlags, type StatsigFlags } from '@/constants/statsig';
import { type DisplayUnit, type QuickLimitOption } from '@/constants/trade';
import { type ConnectorType, type DydxAddress, type WalletType } from '@/constants/wallets';

import type { Deposit, Withdraw } from '@/state/transfers';

import type { OnboardingState, OnboardingSteps } from './account';
import { type DialogTypesTypes } from './dialogs';
import type { SupportedLocales } from './localization';
import type { DydxNetwork } from './networks';

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
    AppMode: ofType<'simple' | 'pro' | 'none'>(),
    Locale: ofType<SupportedLocales>(),
    Breakpoint: ofType<
      'MOBILE' | 'TABLET' | 'DESKTOP_SMALL' | 'DESKTOP_MEDIUM' | 'DESKTOP_LARGE' | 'UNSUPPORTED'
    >(),
    Version: ofType<string | null>(),

    // Location
    Geo: ofType<string | null>(),

    // StatSigFlags
    StatsigFlags: ofType<{ [key in StatsigFlags]?: boolean }>(),
    CustomFlags: ofType<{ [key in CustomFlags]?: boolean }>(),

    // Network
    Network: ofType<DydxNetwork>(),

    // Wallet
    WalletType: ofType<WalletType | string | null>(),
    WalletConnectorType: ofType<ConnectorType | null>(),
    WalletAddress: ofType<string | null>(),
    IsRememberMe: ofType<boolean | null>(),

    // Account
    DydxAddress: ofType<DydxAddress | null>(),
    SubaccountNumber: ofType<number | null>(),

    // Affiliate
    AffiliateAddress: ofType<string | null>(),

    // validators
    BonsaiValidatorUrl: ofType<string | null>(),
  },
  { tag: 'type' as const, value: 'payload' as const }
);

export const AnalyticsUserPropertyLoggableTypes = {
  AppMode: 'appMode',
  Locale: 'selectedLocale',
  Geo: 'geo',
  Breakpoint: 'breakpoint',
  Version: 'version',
  StatsigFlags: 'statsigFlags',
  CustomDomainReferrer: 'customDomainReferrer',
  Network: 'network',
  WalletType: 'walletType',
  WalletConnectorType: 'walletConnectorType',
  WalletAddress: 'walletAddress',
  IsRememberMe: 'isRememberMe',
  DydxAddress: 'dydxAddress',
  SubaccountNumber: 'subaccountNumber',
  AffiliateAddress: 'affiliateAddress',
  BonsaiValidatorUrl: 'bonsaiValidator',
  CustomFlags: 'customFlags',
} as const satisfies Record<AnalyticsUserPropertyTypes, string>;

export type AnalyticsUserProperty = UnionOf<typeof AnalyticsUserProperties>;
export type AnalyticsUserPropertyTypes = TagsOf<typeof AnalyticsUserProperties>;
export type AnalyticsUserPropertyPayloads = RecordOf<typeof AnalyticsUserProperties>;

export const AnalyticsEvents = unionize(
  {
    // App
    AppStart: ofType<{}>(),
    NetworkStatus: ofType<{
      status: ApiStatus;
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
    ExportVaultTransfersCheckboxClick: ofType<{
      value: boolean;
    }>(),
    ExportFundingPaymentsCheckboxClick: ofType<{
      value: boolean;
    }>(),

    // Navigation
    NavigatePage: ofType<{
      path: string;
      previousPath: string;
    }>(),
    NavigateDialog: ofType<{
      type: DialogTypesTypes;
      fromDialogType?: DialogTypesTypes;
    }>(),
    NavigateDialogClose: ofType<{
      type: DialogTypesTypes;
    }>(),
    NavigateExternal: ofType<{
      link: string;
    }>(),

    // Wallet
    ConnectWallet: ofType<{
      walletType: WalletType | string;
      walletConnectorType: ConnectorType;
    }>(),
    DisconnectWallet: ofType<{}>(),

    // Onboarding
    OnboardingDeriveKeysSignatureReceived: ofType<{
      signatureNumber: number;
    }>(),
    OnboardingAcknowledgeTermsButtonClick: ofType<{
      agreed: boolean;
    }>(),
    OnboardingSwitchNetworkClick: ofType<{}>(),
    OnboardingSendRequestClick: ofType<{
      firstAttempt: boolean;
    }>(),
    OnboardingTriggerClick: ofType<{
      // if onboarding state is Disconnected, then user clicked "Connect Wallet"
      // if onboarding state is WalletConnected, then user clicked "Recover Keys"
      state: OnboardingState;
      autoconnectMobileWallet?: boolean;
    }>(),
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
    TransferDepositFundsClick: ofType<{
      chainId: string | undefined;
      tokenAddress: string | undefined;
      tokenSymbol: string | undefined;
      slippage: number | undefined;
      gasFee: number | undefined;
      bridgeFee: number | undefined;
      exchangeRate: number | undefined;
      estimatedRouteDuration: number | undefined;
      toAmount: number | undefined;
      toAmountMin: number | undefined;
      depositCTAString: string;
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
      isFunkit?: boolean;
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

    // Trading
    TradeOrderTypeSelected: ofType<{
      type: TradeFormType;
    }>(),
    DisplayUnitToggled: ofType<{
      newDisplayUnit: DisplayUnit;
      entryPoint?: string;
      assetId: string;
    }>(),

    TradePlaceOrderClick: ofType<
      PlaceOrderPayload & {
        isClosePosition: boolean;
        isSimpleUi?: boolean;
      }
    >(),
    TradePlaceOrder: ofType<PlaceOrderPayload>(),
    TradePlaceOrderSubmissionConfirmed: ofType<PlaceOrderPayload & { durationMs: number }>(),
    TradePlaceOrderSubmissionFailed: ofType<
      PlaceOrderPayload & { error: string; durationMs: number }
    >(),
    TradePlaceOrderConfirmed: ofType<
      PlaceOrderPayload & {
        roundtripMs: number;
        sinceSubmissionMs: number | undefined;
      }
    >(),

    TradeCancelOrderClick: ofType<{ orderId: string }>(),
    TradeCancelOrder: ofType<{ orderId: string }>(),
    TradeCancelOrderSubmissionConfirmed: ofType<{ orderId: string; durationMs: number }>(),
    TradeCancelOrderSubmissionFailed: ofType<{
      orderId: string;
      error: string;
      durationMs: number;
    }>(),
    TradeCancelOrderConfirmed: ofType<{
      roundtripMs: number;
      sinceSubmissionMs: number | undefined;
      orderId: string;
    }>(),

    TriggerOrderClick: ofType<{ marketId: string | undefined }>(),
    TradeCancelAllOrdersClick: ofType<{ marketId?: string }>(),
    TradeCloseAllPositionsClick: ofType<{}>(),
    TradeQuickLimitOptionClick: ofType<{
      quickLimit: QuickLimitOption;
      side?: OrderSide;
      marketId?: string;
    }>(),

    // TradingView actions
    TradingViewOrderModificationSubmitted: ofType<
      PlaceOrderPayload & {
        previousOrderClientId: string;
        previousOrderPrice: string;
      }
    >,
    TradingViewOrderModificationSuccess: ofType<{
      clientId: string;
    }>,
    TradingViewLimitOrderDrafted: ofType<{
      marketId: string;
      price: string;
    }>,
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
      error?: Error;
      metadata?: any;
    }>(),
    RouteError: ofType<{
      transferType?: 'withdrawal' | 'deposit';
      errorMessage?: string;
      amount: string;
      chainId?: string;
      assetaddress?: string;
      assetSymbol?: string;
      assetName?: string;
    }>(),
    WebsocketParseError: ofType<{ message: string }>(),

    // vaults
    ClickViewVaultFromPositionCard: ofType<{}>(),
    ClickViewVaultFromOverview: ofType<{}>(),

    EnterValidVaultAmountForm: ofType<{}>(),
    VaultFormPreviewStep: ofType<{ operation: 'DEPOSIT' | 'WITHDRAW'; amount: number }>(),
    AttemptVaultOperation: ofType<{
      operation: 'DEPOSIT' | 'WITHDRAW';
      userOperationId: string;
      amount: number;
      slippage: number | null | undefined;
      requiredSlippageAck: boolean | null | undefined;
      showedSlippageWarning: boolean | null | undefined;
    }>(),
    VaultOperationPreAborted: ofType<{
      operation: 'DEPOSIT' | 'WITHDRAW';
      userOperationId: string;
      amount: number;
    }>(),
    SuccessfulVaultOperation: ofType<{
      operation: 'DEPOSIT' | 'WITHDRAW';
      userOperationId: string;
      amount: number;
      amountDiff: number | null | undefined;
      submissionTimeBase: number;
      submissionTimeTotal: number;
    }>(),
    VaultOperationProtocolError: ofType<{
      operation: 'DEPOSIT' | 'WITHDRAW';
      userOperationId: string;
    }>(),

    // Affiliate
    AffiliateInviteFriendsModalOpened: ofType<{ isAffiliateEligible: boolean }>(),
    AffiliateRegistration: ofType<{ affiliateAddress: string }>(),
    AffiliateRemoveSavedReferralAddress: ofType<{
      affiliateAddress: string;
      reason: AffiliateRemovalReason;
    }>(),
    AffiliateSaveReferralAddress: ofType<{ affiliateAddress: string }>(),
    AffiliateURLCopied: ofType<{ url: string }>(),

    // Favoriting Markets
    FavoriteMarket: ofType<{ marketId: string }>(),
    UnfavoriteMarket: ofType<{ marketId: string }>(),

    // Launching Markets
    LaunchMarketFormSelectedAsset: ofType<{ asset: string }>(),
    LaunchMarketFormStepChange: ofType<{
      currentStep: number;
      updatedStep: number;
      ticker?: string;
      userFreeCollateral?: number;
    }>(),
    LaunchMarketPageChangePriceChartTimeframe: ofType<{ timeframe: string; asset: string }>(),
    LaunchMarketTransaction: ofType<{ marketId: string }>(),
    LaunchMarketViewFromTradePage: ofType<{ marketId: string }>(),

    // Deposit
    DepositInitiated: ofType<
      Pick<
        RouteResponse,
        | 'sourceAssetDenom'
        | 'sourceAssetChainId'
        | 'amountIn'
        | 'amountOut'
        | 'usdAmountOut'
        | 'estimatedAmountOut'
        | 'swapPriceImpactPercent'
        | 'estimatedRouteDurationSeconds'
      > & {
        isInstantDeposit: boolean;
      }
    >(),
    DepositSubmitted: ofType<
      Omit<Deposit, 'token'> & {
        tokenInChainId: string;
        tokenInDenom: string;
        userAddresses: UserAddress[];
      }
    >(),
    DepositFinalized: ofType<
      Omit<Deposit, 'token'> & { tokenInChainId: string; tokenInDenom: string }
    >(),
    DepositError: ofType<{ error: string }>(),
    SelectQrDeposit: ofType<{}>(),

    // Withdraw
    WithdrawInitiated:
      ofType<
        Pick<
          RouteResponse,
          | 'sourceAssetDenom'
          | 'sourceAssetChainId'
          | 'amountIn'
          | 'amountOut'
          | 'usdAmountOut'
          | 'estimatedAmountOut'
          | 'swapPriceImpactPercent'
          | 'estimatedRouteDurationSeconds'
        >
      >(),
    WithdrawSubmitted: ofType<Withdraw>(),
    WithdrawFinalized: ofType<Withdraw>(),
    WithdrawError: ofType<{ error: string }>(),
  },
  { tag: 'type' as const, value: 'payload' as const }
);
export type AnalyticsEvent = UnionOf<typeof AnalyticsEvents>;
export type AnalyticsEventTypes = TagsOf<typeof AnalyticsEvents>;
export type AnalyticsEventPayloads = RecordOf<typeof AnalyticsEvents>;

export const DEFAULT_TRANSACTION_MEMO = 'dYdX Frontend (web)';

export enum TransactionMemo {
  depositToSubaccount = `${DEFAULT_TRANSACTION_MEMO} | Deposit from wallet to subaccount`,
  withdrawFromSubaccount = `${DEFAULT_TRANSACTION_MEMO} | Withdraw from subaccount to wallet`,
  withdrawFromAccount = `${DEFAULT_TRANSACTION_MEMO} | Withdraw from account`,
  placeOrder = `${DEFAULT_TRANSACTION_MEMO} | Place Order`,
  cancelOrderTransfer = `${DEFAULT_TRANSACTION_MEMO} | Cancel Order transfer`,
  reclaimIsolatedMarginFunds = `${DEFAULT_TRANSACTION_MEMO} | Reclaim Isolated Margin Funds`,
  launchMarket = `${DEFAULT_TRANSACTION_MEMO} | Launch Market`,
  transferForIsolatedMarginOrder = `${DEFAULT_TRANSACTION_MEMO} | Transfer for Isolated Margin Order`,
}

export enum AffiliateRemovalReason {
  OwnReferralCode = 'own_referral_code',
  AffiliateAlreadyRegistered = 'affiliate_already_registered',
}

export const lastSuccessfulRestRequestByOrigin: Record<URL['origin'], number> = {};
export const lastSuccessfulWebsocketRequestByOrigin: Record<URL['origin'], number> = {};
