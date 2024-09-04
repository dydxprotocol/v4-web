/* eslint-disable react/no-unstable-nested-components */
import { DialogTypes } from '@/constants/dialogs';

import { AcknowledgeTermsDialog } from '@/views/dialogs/AcknowledgeTermsDialog';
import { AdjustIsolatedMarginDialog } from '@/views/dialogs/AdjustIsolatedMarginDialog';
import { AdjustTargetLeverageDialog } from '@/views/dialogs/AdjustTargetLeverageDialog';
import { CancelAllOrdersDialog } from '@/views/dialogs/CancelAllOrdersDialog';
import { ClosePositionDialog } from '@/views/dialogs/ClosePositionDialog';
import { ComplianceConfigDialog } from '@/views/dialogs/ComplianceConfigDialog';
import { ConfirmPendingDepositDialog } from '@/views/dialogs/ConfirmPendingDepositDialog';
import { DepositDialog } from '@/views/dialogs/DepositDialog';
import { FillDetailsDialog } from '@/views/dialogs/DetailsDialog/FillDetailsDialog';
import { OrderDetailsDialog } from '@/views/dialogs/DetailsDialog/OrderDetailsDialog';
import { DisconnectDialog } from '@/views/dialogs/DisconnectDialog';
import { DisplaySettingsDialog } from '@/views/dialogs/DisplaySettingsDialog';
import { ExchangeOfflineDialog } from '@/views/dialogs/ExchangeOfflineDialog';
import { ExternalLinkDialog } from '@/views/dialogs/ExternalLinkDialog';
import { ExternalNavKeplrDialog } from '@/views/dialogs/ExternalNavKeplrDialog';
import { ExternalNavStrideDialog } from '@/views/dialogs/ExternalNavStrideDialog';
import { FunkitDepositDialog } from '@/views/dialogs/FunkitDepositDialog';
import { GeoComplianceDialog } from '@/views/dialogs/GeoComplianceDialog';
import { GlobalCommandDialog } from '@/views/dialogs/GlobalCommandDialog';
import { HelpDialog } from '@/views/dialogs/HelpDialog';
import { ManageFundsDialog } from '@/views/dialogs/ManageFundsDialog';
import { MnemonicExportDialog } from '@/views/dialogs/MnemonicExportDialog';
import { MobileDownloadDialog } from '@/views/dialogs/MobileDownloadDialog';
import { MobileSignInDialog } from '@/views/dialogs/MobileSignInDialog';
import { NewMarketAgreementDialog } from '@/views/dialogs/NewMarketAgreementDialog';
import { NewMarketMessageDetailsDialog } from '@/views/dialogs/NewMarketMessageDetailsDialog';
import { OnboardingDialog } from '@/views/dialogs/OnboardingDialog';
import { PredictionMarketIntroDialog } from '@/views/dialogs/PredictionMarketIntroDialog';
import { PreferencesDialog } from '@/views/dialogs/PreferencesDialog';
import { RateLimitDialog } from '@/views/dialogs/RateLimitDialog';
import { RestrictedGeoDialog } from '@/views/dialogs/RestrictedGeoDialog';
import { RestrictedWalletDialog } from '@/views/dialogs/RestrictedWalletDialog';
import { SelectMarginModeDialog } from '@/views/dialogs/SelectMarginModeDialog';
import { SharePNLAnalyticsDialog } from '@/views/dialogs/SharePNLAnalyticsDialog';
import { StakeDialog } from '@/views/dialogs/StakeDialog';
import { StakingRewardDialog } from '@/views/dialogs/StakingRewardDialog';
import { TradeDialog } from '@/views/dialogs/TradeDialog';
import { TransferDialog } from '@/views/dialogs/TransferDialog';
import { TriggersDialog } from '@/views/dialogs/TriggersDialog';
import { UnstakeDialog } from '@/views/dialogs/UnstakeDialog';
import { VaultDepositWithdrawDialog } from '@/views/dialogs/VaultDepositWithdrawDialog';
import { WithdrawDialog } from '@/views/dialogs/WithdrawDialog';
import { WithdrawalGateDialog } from '@/views/dialogs/WithdrawalGateDialog';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialog, openDialog } from '@/state/dialogs';
import { getActiveDialog } from '@/state/dialogsSelectors';

export const DialogManager = () => {
  const dispatch = useAppDispatch();
  const activeDialog = useAppSelector(getActiveDialog);

  if (!activeDialog) return null;

  const modalProps = {
    setIsOpen: (isOpen: boolean) => {
      dispatch(isOpen ? openDialog(activeDialog) : closeDialog());
    },
  };

  return DialogTypes.match(activeDialog, {
    AcknowledgeTerms: (args) => <AcknowledgeTermsDialog {...args} {...modalProps} />,
    AdjustIsolatedMargin: (args) => <AdjustIsolatedMarginDialog {...args} {...modalProps} />,
    AdjustTargetLeverage: (args) => <AdjustTargetLeverageDialog {...args} {...modalProps} />,
    ClosePosition: (args) => <ClosePositionDialog {...args} {...modalProps} />,
    CancelPendingOrders: (args) => <CancelAllOrdersDialog {...args} {...modalProps} />,
    ComplianceConfig: (args) => <ComplianceConfigDialog {...args} {...modalProps} />,
    ConfirmPendingDeposit: (args) => <ConfirmPendingDepositDialog {...args} {...modalProps} />,
    Deposit: (args) => <DepositDialog {...args} {...modalProps} />,
    FunkitDeposit: (args) => <FunkitDepositDialog {...args} />,
    DisconnectWallet: (args) => <DisconnectDialog {...args} {...modalProps} />,
    DisplaySettings: (args) => <DisplaySettingsDialog {...args} {...modalProps} />,
    ExchangeOffline: (args) => <ExchangeOfflineDialog {...args} {...modalProps} />,
    ExternalLink: (args) => <ExternalLinkDialog {...args} {...modalProps} />,
    ExternalNavStride: (args) => <ExternalNavStrideDialog {...args} {...modalProps} />,
    FillDetails: (args) => <FillDetailsDialog {...args} {...modalProps} />,
    GeoCompliance: (args) => <GeoComplianceDialog {...args} {...modalProps} />,
    GlobalCommand: (args) => <GlobalCommandDialog {...args} {...modalProps} />,
    Help: (args) => <HelpDialog {...args} {...modalProps} />,
    ExternalNavKeplr: (args) => <ExternalNavKeplrDialog {...args} {...modalProps} />,
    ManageFunds: (args) => <ManageFundsDialog {...args} {...modalProps} />,
    MnemonicExport: (args) => <MnemonicExportDialog {...args} {...modalProps} />,
    MobileDownload: (args) => <MobileDownloadDialog {...args} {...modalProps} />,
    MobileSignIn: (args) => <MobileSignInDialog {...args} {...modalProps} />,
    NewMarketAgreement: (args) => <NewMarketAgreementDialog {...args} {...modalProps} />,
    NewMarketMessageDetails: (args) => <NewMarketMessageDetailsDialog {...args} {...modalProps} />,
    Onboarding: (args) => <OnboardingDialog {...args} {...modalProps} />,
    OrderDetails: (args) => <OrderDetailsDialog {...args} {...modalProps} />,
    PredictionMarketIntro: (args) => <PredictionMarketIntroDialog {...args} {...modalProps} />,
    Preferences: (args) => <PreferencesDialog {...args} {...modalProps} />,
    RateLimit: (args) => <RateLimitDialog {...args} {...modalProps} />,
    RestrictedGeo: (args) => <RestrictedGeoDialog {...args} {...modalProps} />,
    RestrictedWallet: (args) => <RestrictedWalletDialog {...args} {...modalProps} />,
    SelectMarginMode: (args) => <SelectMarginModeDialog {...args} {...modalProps} />,
    SharePNLAnalytics: (args) => <SharePNLAnalyticsDialog {...args} {...modalProps} />,
    Stake: (args) => <StakeDialog {...args} {...modalProps} />,
    StakingReward: (args) => <StakingRewardDialog {...args} {...modalProps} />,
    Trade: (args) => <TradeDialog {...args} {...modalProps} />,
    Triggers: (args) => <TriggersDialog {...args} {...modalProps} />,
    Transfer: (args) => <TransferDialog {...args} {...modalProps} />,
    Unstake: (args) => <UnstakeDialog {...args} {...modalProps} />,
    VaultDepositWithdraw: (args) => <VaultDepositWithdrawDialog {...args} {...modalProps} />,
    Withdraw: (args) => <WithdrawDialog {...args} {...modalProps} />,
    WithdrawalGated: (args) => <WithdrawalGateDialog {...args} {...modalProps} />,
  });
};
