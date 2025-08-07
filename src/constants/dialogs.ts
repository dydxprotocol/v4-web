import { ReactNode } from 'react';

import { OrderSide } from '@/bonsai/forms/trade/types';
import { PositionUniqueId, SubaccountPosition } from '@/bonsai/types/summaryTypes';
import { TagsOf, UnionOf, ofType, unionize } from 'unionize';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { BigNumberish } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

import { IAffiliateStats } from './affiliates';
import { DydxChainAsset } from './wallets';

type SharedDialogProps = { setIsOpen: (open: boolean) => void };
export type DialogProps<T> = T & SharedDialogProps;

export type AcknowledgeTermsDialogProps = {};
export type AdjustIsolatedMarginDialogProps = {
  positionId: SubaccountPosition['uniqueId'];
};
export type CheckEmailDialogProps = {
  onClose: () => void;
};
export type ClosePositionDialogProps = {};
export type CloseAllPositionsConfirmationDialogProps = {};
export type CancelAllOrdersConfirmationDialogProps = { marketId?: string };
export type CancelOrphanedTriggersDialogProps = {};
export type CancelPendingOrdersDialogProps = { marketId: string };
export type ComplianceConfigDialogProps = {};
export type ConfirmPendingDepositDialogProps = {
  usdcBalance: number;
};
export type DisconnectWalletDialogProps = {};
export type DisplaySettingsDialogProps = {};
export type ExchangeOfflineDialogProps = { preventClose?: boolean };
export type ExternalLinkDialogProps = {
  buttonText?: ReactNode;
  link?: string;
  linkDescription?: string;
  title?: ReactNode;
  slotContent?: ReactNode;
};
export type ExternalNavStrideDialogProps = {};
export type FillDetailsDialogProps = { fillId: string };
export type GeoComplianceDialogProps = {};
export type GlobalCommandDialogProps = {};
export type HelpDialogProps = {};
export type ExternalNavKeplrDialogProps = {};
export type MnemonicExportDialogProps = {};
export type MobileDownloadDialogProps = { mobileAppUrl: string };
export type MobileSignInDialogProps = {};
export type OnboardingDialogProps = {};
export type OrderDetailsDialogProps = { orderId: string };
export type PredictionMarketIntroDialogProps = {};
export type PreferencesDialogProps = {};
export type RateLimitDialogProps = { preventClose?: boolean };
export type ReclaimChildSubaccountFundsDialogProps = {};
export type ReferralDialogProps = { refCode: string };
export type RestrictedGeoDialogProps = { preventClose?: boolean };
export type RestrictedWalletDialogProps = { preventClose?: boolean };
export type SelectMarginModeDialogProps = {};
export type SetupPasskeyDialogProps = { onClose: () => void };
export type ShareAffiliateDialogProps = {};
export type SharePNLAnalyticsDialogProps = {
  marketId: string;
  assetId: string;
  leverage: Nullable<number>;
  oraclePrice: Nullable<number>;
  entryPrice: Nullable<number>;
  unrealizedPnl: Nullable<number>;
  side: Nullable<IndexerPositionSide>;
  sideLabel: Nullable<string>;
};
export type SimpleUiTradeDialogProps =
  | {
      side: OrderSide;
      isClosingPosition: false;
    }
  | {
      isClosingPosition: true;
      side?: undefined;
    };
export type StakeDialogProps = {};
export type StakingRewardDialogProps = { usdcRewards: BigNumberish; validators: string[] };
export type TradeDialogProps = {
  isOpen?: boolean;
  slotTrigger?: React.ReactNode;
};
export type TriggersDialogProps = {
  positionUniqueId: PositionUniqueId;
  marketId: string;
  assetId: string;
  navigateToMarketOrders: (market: string) => void;
};
export type TransferDialogProps = { selectedAsset?: DydxChainAsset };
export type UnstakeDialogProps = {};
export type VaultDepositWithdrawDialogProps = { initialType?: 'DEPOSIT' | 'WITHDRAW' };
export type WithdrawDialog2Props = {};
export type DepositDialog2Props = {};
export type TransferStatusDialogProps = { transferId: string };
export type WithdrawalGatedDialogProps = {
  transferType: 'withdrawal' | 'transfer';
  estimatedUnblockTime?: string | null;
};
export type WithdrawFromSubaccountDialogProps = {};
export type CriteriaDialogProps = {
  accountStats?: IAffiliateStats;
  stakedAmount?: bigint;
  userTier?: number | 'vip';
};
export type CoinbaseDepositDialogProps = {
  onBack?: () => void;
};

export const DialogTypes = unionize(
  {
    AcknowledgeTerms: ofType<AcknowledgeTermsDialogProps>(),
    AdjustIsolatedMargin: ofType<AdjustIsolatedMarginDialogProps>(),
    CancelAllOrdersConfirmation: ofType<CancelAllOrdersConfirmationDialogProps>(),
    CancelOrphanedTriggers: ofType<CancelOrphanedTriggersDialogProps>(),
    CancelPendingOrders: ofType<CancelPendingOrdersDialogProps>(),
    CheckEmail: ofType<CheckEmailDialogProps>(),
    CloseAllPositionsConfirmation: ofType<CloseAllPositionsConfirmationDialogProps>(),
    ClosePosition: ofType<ClosePositionDialogProps>(),
    ComplianceConfig: ofType<ComplianceConfigDialogProps>(),
    CoinbaseDepositDialog: ofType<CoinbaseDepositDialogProps>(),
    ConfirmPendingDeposit: ofType<ConfirmPendingDepositDialogProps>(),
    Criteria: ofType<CriteriaDialogProps>(),
    /* TODO: rename Deposit2 to Deposit once old deposit flow is deprecated */
    Deposit2: ofType<DepositDialog2Props>(),
    DisconnectWallet: ofType<DisconnectWalletDialogProps>(),
    DisplaySettings: ofType<DisplaySettingsDialogProps>(),
    ExchangeOffline: ofType<ExchangeOfflineDialogProps>(),
    ExternalLink: ofType<ExternalLinkDialogProps>(),
    ExternalNavKeplr: ofType<ExternalNavKeplrDialogProps>(),
    ExternalNavStride: ofType<ExternalNavStrideDialogProps>(),
    FillDetails: ofType<FillDetailsDialogProps>(),
    GeoCompliance: ofType<GeoComplianceDialogProps>(),
    GlobalCommand: ofType<GlobalCommandDialogProps>(),
    Help: ofType<HelpDialogProps>(),
    MnemonicExport: ofType<MnemonicExportDialogProps>(),
    MobileDownload: ofType<MobileDownloadDialogProps>(),
    MobileSignIn: ofType<MobileSignInDialogProps>(),
    Onboarding: ofType<OnboardingDialogProps>(),
    OrderDetails: ofType<OrderDetailsDialogProps>(),
    PredictionMarketIntro: ofType<PredictionMarketIntroDialogProps>(),
    Preferences: ofType<PreferencesDialogProps>(),
    RateLimit: ofType<RateLimitDialogProps>(),
    ReclaimChildSubaccountFunds: ofType<ReclaimChildSubaccountFundsDialogProps>(),
    Referral: ofType<ReferralDialogProps>(),
    RestrictedGeo: ofType<RestrictedGeoDialogProps>(),
    RestrictedWallet: ofType<RestrictedWalletDialogProps>(),
    SetupPasskey: ofType<SetupPasskeyDialogProps>(),
    ShareAffiliate: ofType<ShareAffiliateDialogProps>(),
    SharePNLAnalytics: ofType<SharePNLAnalyticsDialogProps>(),
    SimpleUiTrade: ofType<SimpleUiTradeDialogProps>(),
    Stake: ofType<StakeDialogProps>(),
    StakingReward: ofType<StakingRewardDialogProps>(),
    Trade: ofType<TradeDialogProps>(),
    Transfer: ofType<TransferDialogProps>(),
    TransferStatus: ofType<TransferStatusDialogProps>(),
    Triggers: ofType<TriggersDialogProps>(),
    Unstake: ofType<UnstakeDialogProps>(),
    VaultDepositWithdraw: ofType<VaultDepositWithdrawDialogProps>(),
    Withdraw2: ofType<WithdrawDialog2Props>(),
    WithdrawalGated: ofType<WithdrawalGatedDialogProps>(),
    WithdrawFromSubaccount: ofType<WithdrawFromSubaccountDialogProps>(),
  },
  { tag: 'type' as const, value: 'props' as const }
);
export type DialogType = UnionOf<typeof DialogTypes>;
export type DialogTypesTypes = TagsOf<typeof DialogTypes>;

export type ClosePositionFormProps = {};
export type SelectMarginModeFormProps = {};

export const TradeBoxDialogTypes = unionize(
  {
    ClosePosition: ofType<ClosePositionFormProps>(),
  },
  { tag: 'type' as const, value: 'props' as const }
);
export type TradeBoxDialogType = UnionOf<typeof TradeBoxDialogTypes>;
