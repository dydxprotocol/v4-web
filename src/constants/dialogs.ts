import { ReactNode } from 'react';

import { TagsOf, UnionOf, ofType, unionize } from 'unionize';

import { BigNumberish } from '@/lib/numbers';

import { AbacusPositionSides, Nullable, SubaccountOrder, SubaccountPosition } from './abacus';
import { NewMarketProposal } from './potentialMarkets';
import { DydxChainAsset } from './wallets';

type SharedDialogProps = { setIsOpen: (open: boolean) => void };
export type DialogProps<T> = T & SharedDialogProps;

export type AcknowledgeTermsDialogProps = {};
export type AdjustIsolatedMarginDialogProps = {
  positionId: SubaccountPosition['id'];
};
export type AdjustTargetLeverageDialogProps = {};
export type ClosePositionDialogProps = {};
export type CancelPendingOrdersDialogProps = { marketId: string };
export type ComplianceConfigDialogProps = {};
export type ConfirmPendingDepositDialogProps = {
  usdcBalance: number;
};
export type DepositDialogProps = {};
export type FunkitDepositDialogProps = {};
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
export type LaunchMarketDialogProps = {};
export type ManageFundsDialogProps = { selectedTransferType?: string };
export type MnemonicExportDialogProps = {};
export type MobileDownloadDialogProps = { mobileAppUrl: string };
export type MobileSignInDialogProps = {};
export type NewMarketAgreementDialogProps = { acceptTerms: () => void };
export type NewMarketMessageDetailsDialogProps = {
  preventClose?: boolean;
  assetData: NewMarketProposal;
  clobPairId?: number;
  liquidityTier?: number;
};
export type OnboardingDialogProps = {};
export type OrderDetailsDialogProps = { orderId: string };
export type PredictionMarketIntroDialogProps = {};
export type PreferencesDialogProps = {};
export type RateLimitDialogProps = { preventClose?: boolean };
export type RestrictedGeoDialogProps = { preventClose?: boolean };
export type RestrictedWalletDialogProps = { preventClose?: boolean };
export type SelectMarginModeDialogProps = {};
export type ShareAffiliateDialogProps = {};
export type SharePNLAnalyticsDialogProps = {
  marketId: string;
  assetId: string;
  leverage: Nullable<number>;
  oraclePrice: Nullable<number>;
  entryPrice: Nullable<number>;
  unrealizedPnl: Nullable<number>;
  side: Nullable<AbacusPositionSides>;
  sideLabel: Nullable<string>;
};
export type StakeDialogProps = {};
export type StakingRewardDialogProps = { usdcRewards: BigNumberish; validators: string[] };
export type TradeDialogProps = {
  isOpen?: boolean;
  slotTrigger?: React.ReactNode;
};
export type TriggersDialogProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  navigateToMarketOrders: (market: string) => void;
};
export type TransferDialogProps = { selectedAsset?: DydxChainAsset };
export type UnstakeDialogProps = {};
export type VaultDepositWithdrawDialogProps = { initialType?: 'deposit' | 'withdraw' };
export type WithdrawDialogProps = {};
export type WithdrawalGatedDialogProps = {
  transferType: 'withdrawal' | 'transfer';
  estimatedUnblockTime?: string | null;
};

export const DialogTypes = unionize(
  {
    AcknowledgeTerms: ofType<AcknowledgeTermsDialogProps>(),
    AdjustIsolatedMargin: ofType<AdjustIsolatedMarginDialogProps>(),
    AdjustTargetLeverage: ofType<AdjustTargetLeverageDialogProps>(),
    CancelPendingOrders: ofType<CancelPendingOrdersDialogProps>(),
    ClosePosition: ofType<ClosePositionDialogProps>(),
    ComplianceConfig: ofType<ComplianceConfigDialogProps>(),
    ConfirmPendingDeposit: ofType<ConfirmPendingDepositDialogProps>(),
    FunkitDeposit: ofType<FunkitDepositDialogProps>(),
    Deposit: ofType<DepositDialogProps>(),
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
    LaunchMarket: ofType<LaunchMarketDialogProps>(),
    ManageFunds: ofType<ManageFundsDialogProps>(),
    MnemonicExport: ofType<MnemonicExportDialogProps>(),
    MobileDownload: ofType<MobileDownloadDialogProps>(),
    MobileSignIn: ofType<MobileSignInDialogProps>(),
    NewMarketAgreement: ofType<NewMarketAgreementDialogProps>(),
    NewMarketMessageDetails: ofType<NewMarketMessageDetailsDialogProps>(),
    Onboarding: ofType<OnboardingDialogProps>(),
    OrderDetails: ofType<OrderDetailsDialogProps>(),
    PredictionMarketIntro: ofType<PredictionMarketIntroDialogProps>(),
    Preferences: ofType<PreferencesDialogProps>(),
    RateLimit: ofType<RateLimitDialogProps>(),
    RestrictedGeo: ofType<RestrictedGeoDialogProps>(),
    RestrictedWallet: ofType<RestrictedWalletDialogProps>(),
    SelectMarginMode: ofType<SelectMarginModeDialogProps>(),
    ShareAffiliate: ofType<ShareAffiliateDialogProps>(),
    SharePNLAnalytics: ofType<SharePNLAnalyticsDialogProps>(),
    Stake: ofType<StakeDialogProps>(),
    StakingReward: ofType<StakingRewardDialogProps>(),
    Trade: ofType<TradeDialogProps>(),
    Transfer: ofType<TransferDialogProps>(),
    Triggers: ofType<TriggersDialogProps>(),
    Unstake: ofType<UnstakeDialogProps>(),
    VaultDepositWithdraw: ofType<VaultDepositWithdrawDialogProps>(),
    Withdraw: ofType<WithdrawDialogProps>(),
    WithdrawalGated: ofType<WithdrawalGatedDialogProps>(),
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
    SelectMarginMode: ofType<SelectMarginModeFormProps>(),
  },
  { tag: 'type' as const, value: 'props' as const }
);
export type TradeBoxDialogType = UnionOf<typeof TradeBoxDialogTypes>;
