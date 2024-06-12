import { ReactNode } from 'react';

import { UnionOf, ofType, unionize } from 'unionize';

import { BigNumberish } from '@/lib/numbers';

import { SubaccountOrder, SubaccountPosition } from './abacus';
import { NewMarketProposal } from './potentialMarkets';
import { DydxChainAsset } from './wallets';

type SharedDialogProps = { setIsOpen: (open: boolean) => void };
export type DialogProps<T> = T & SharedDialogProps;

export type AdjustIsolatedMarginDialogProps = {
  positionId: SubaccountPosition['id'];
};
export type AdjustTargetLeverageDialogProps = {};
export type ClosePositionDialogProps = {};
export type CancelPendingOrdersDialogProps = { marketId: string };
export type ComplianceConfigDialogProps = {};
export type DepositDialogProps = {};
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
export type HelpDialogProps = {};
export type ExternalNavKeplrDialogProps = {};
export type ManageFundsDialogProps = { selectedTransferType?: string };
export type MnemonicExportDialogProps = {};
export type MobileDownloadDialogProps = {};
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
export type PreferencesDialogProps = {};
export type RateLimitDialogProps = { preventClose?: boolean };
export type RestrictedGeoDialogProps = { preventClose?: boolean };
export type RestrictedWalletDialogProps = { preventClose?: boolean };
export type SelectMarginModeDialogProps = {};
export type StakeDialogProps = {};
export type StakingRewardDialogProps = { usdcRewards: BigNumberish };
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
export type WithdrawDialogProps = {};
export type WithdrawalGatedDialogProps = {
  transferType: 'withdrawal' | 'transfer';
  estimatedUnblockTime?: string | null;
};

export const DialogTypes = unionize({
  AdjustIsolatedMargin: ofType<AdjustIsolatedMarginDialogProps>(),
  AdjustTargetLeverage: ofType<AdjustTargetLeverageDialogProps>(),
  ClosePosition: ofType<ClosePositionDialogProps>(),
  CancelPendingOrders: ofType<CancelPendingOrdersDialogProps>(),
  ComplianceConfig: ofType<ComplianceConfigDialogProps>(),
  Deposit: ofType<DepositDialogProps>(),
  DisconnectWallet: ofType<DisconnectWalletDialogProps>(),
  DisplaySettings: ofType<DisplaySettingsDialogProps>(),
  ExchangeOffline: ofType<ExchangeOfflineDialogProps>(),
  ExternalLink: ofType<ExternalLinkDialogProps>(),
  ExternalNavStride: ofType<ExternalNavStrideDialogProps>(),
  FillDetails: ofType<FillDetailsDialogProps>(),
  GeoCompliance: ofType<GeoComplianceDialogProps>(),
  Help: ofType<HelpDialogProps>(),
  ExternalNavKeplr: ofType<ExternalNavKeplrDialogProps>(),
  ManageFunds: ofType<ManageFundsDialogProps>(),
  MnemonicExport: ofType<MnemonicExportDialogProps>(),
  MobileDownload: ofType<MobileDownloadDialogProps>(),
  MobileSignIn: ofType<MobileSignInDialogProps>(),
  NewMarketAgreement: ofType<NewMarketAgreementDialogProps>(),
  NewMarketMessageDetails: ofType<NewMarketMessageDetailsDialogProps>(),
  Onboarding: ofType<OnboardingDialogProps>(),
  OrderDetails: ofType<OrderDetailsDialogProps>(),
  Preferences: ofType<PreferencesDialogProps>(),
  RateLimit: ofType<RateLimitDialogProps>(),
  RestrictedGeo: ofType<RestrictedGeoDialogProps>(),
  RestrictedWallet: ofType<RestrictedWalletDialogProps>(),
  SelectMarginMode: ofType<SelectMarginModeDialogProps>(),
  Stake: ofType<StakeDialogProps>(),
  StakingReward: ofType<StakingRewardDialogProps>(),
  Trade: ofType<TradeDialogProps>(),
  Triggers: ofType<TriggersDialogProps>(),
  Transfer: ofType<TransferDialogProps>(),
  Unstake: ofType<UnstakeDialogProps>(),
  Withdraw: ofType<WithdrawDialogProps>(),
  WithdrawalGated: ofType<WithdrawalGatedDialogProps>(),
});
export type DialogType = UnionOf<typeof DialogTypes>;

export type ClosePositionFormProps = {};
export type SelectMarginModeFormProps = {};

export const TradeBoxDialogTypes = unionize({
  ClosePosition: ofType<ClosePositionFormProps>(),
  SelectMarginMode: ofType<SelectMarginModeFormProps>(),
});
export type TradeBoxDialogType = UnionOf<typeof TradeBoxDialogTypes>;
