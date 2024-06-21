import { DialogTypes } from '@/constants/dialogs';

import { AdjustIsolatedMarginDialog } from '@/views/dialogs/AdjustIsolatedMarginDialog';
import { AdjustTargetLeverageDialog } from '@/views/dialogs/AdjustTargetLeverageDialog';
import { CancelAllOrdersDialog } from '@/views/dialogs/CancelAllOrdersDialog';
import { ClosePositionDialog } from '@/views/dialogs/ClosePositionDialog';
import { ComplianceConfigDialog } from '@/views/dialogs/ComplianceConfigDialog';
import { DepositDialog } from '@/views/dialogs/DepositDialog';
import { FillDetailsDialog } from '@/views/dialogs/DetailsDialog/FillDetailsDialog';
import { OrderDetailsDialog } from '@/views/dialogs/DetailsDialog/OrderDetailsDialog';
import { DisconnectDialog } from '@/views/dialogs/DisconnectDialog';
import { DisplaySettingsDialog } from '@/views/dialogs/DisplaySettingsDialog';
import { ExchangeOfflineDialog } from '@/views/dialogs/ExchangeOfflineDialog';
import { ExternalLinkDialog } from '@/views/dialogs/ExternalLinkDialog';
import { ExternalNavKeplrDialog } from '@/views/dialogs/ExternalNavKeplrDialog';
import { ExternalNavStrideDialog } from '@/views/dialogs/ExternalNavStrideDialog';
import { GeoComplianceDialog } from '@/views/dialogs/GeoComplianceDialog';
import { HelpDialog } from '@/views/dialogs/HelpDialog';
import { ManageFundsDialog } from '@/views/dialogs/ManageFundsDialog';
import { MnemonicExportDialog } from '@/views/dialogs/MnemonicExportDialog';
import { MobileDownloadDialog } from '@/views/dialogs/MobileDownloadDialog';
import { MobileSignInDialog } from '@/views/dialogs/MobileSignInDialog';
import { NewMarketAgreementDialog } from '@/views/dialogs/NewMarketAgreementDialog';
import { NewMarketMessageDetailsDialog } from '@/views/dialogs/NewMarketMessageDetailsDialog';
import { OnboardingDialog } from '@/views/dialogs/OnboardingDialog';
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
import { WithdrawDialog } from '@/views/dialogs/WithdrawDialog';
import { WithdrawalGateDialog } from '@/views/dialogs/WithdrawalGateDialog';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialog, openDialog } from '@/state/dialogs';
import { getActiveDialog } from '@/state/dialogsSelectors';

export const DialogManager = () => {
  const dispatch = useAppDispatch();
  const activeDialog = useAppSelector(getActiveDialog);

  if (!activeDialog) return null;
  const { dialogProps, type } = activeDialog;

  const modalProps = {
    ...dialogProps,
    setIsOpen: (isOpen: boolean) => {
      dispatch(
        isOpen
          ? openDialog({ type: activeDialog.type, dialogProps: activeDialog.dialogProps })
          : closeDialog()
      );
    },
  };

  return {
    [DialogTypes.AdjustIsolatedMargin]: <AdjustIsolatedMarginDialog {...modalProps} />,
    [DialogTypes.AdjustTargetLeverage]: <AdjustTargetLeverageDialog {...modalProps} />,
    [DialogTypes.ClosePosition]: <ClosePositionDialog {...modalProps} />,
    [DialogTypes.CancelPendingOrders]: <CancelAllOrdersDialog {...modalProps} />,
    [DialogTypes.ComplianceConfig]: <ComplianceConfigDialog {...modalProps} />,
    [DialogTypes.Deposit]: <DepositDialog {...modalProps} />,
    [DialogTypes.DisplaySettings]: <DisplaySettingsDialog {...modalProps} />,
    [DialogTypes.DisconnectWallet]: <DisconnectDialog {...modalProps} />,
    [DialogTypes.ExchangeOffline]: <ExchangeOfflineDialog {...modalProps} />,
    [DialogTypes.ExternalLink]: <ExternalLinkDialog {...modalProps} />,
    [DialogTypes.ExternalNavKeplr]: <ExternalNavKeplrDialog {...modalProps} />,
    [DialogTypes.ExternalNavStride]: <ExternalNavStrideDialog {...modalProps} />,
    [DialogTypes.FillDetails]: <FillDetailsDialog {...modalProps} />,
    [DialogTypes.GeoCompliance]: <GeoComplianceDialog {...modalProps} />,
    [DialogTypes.Help]: <HelpDialog {...modalProps} />,
    [DialogTypes.ManageFunds]: <ManageFundsDialog {...modalProps} />,
    [DialogTypes.MnemonicExport]: <MnemonicExportDialog {...modalProps} />,
    [DialogTypes.MobileDownload]: <MobileDownloadDialog {...modalProps} />,
    [DialogTypes.MobileSignIn]: <MobileSignInDialog {...modalProps} />,
    [DialogTypes.NewMarketAgreement]: <NewMarketAgreementDialog {...modalProps} />,
    [DialogTypes.NewMarketMessageDetails]: <NewMarketMessageDetailsDialog {...modalProps} />,
    [DialogTypes.Onboarding]: <OnboardingDialog {...modalProps} />,
    [DialogTypes.OrderDetails]: <OrderDetailsDialog {...modalProps} />,
    [DialogTypes.Preferences]: <PreferencesDialog {...modalProps} />,
    [DialogTypes.RateLimit]: <RateLimitDialog {...modalProps} />,
    [DialogTypes.RestrictedGeo]: <RestrictedGeoDialog {...modalProps} />,
    [DialogTypes.RestrictedWallet]: <RestrictedWalletDialog {...modalProps} />,
    [DialogTypes.SelectMarginMode]: <SelectMarginModeDialog {...modalProps} />,
    [DialogTypes.Stake]: <StakeDialog {...modalProps} />,
    [DialogTypes.StakingReward]: <StakingRewardDialog {...modalProps} />,
    [DialogTypes.Trade]: <TradeDialog {...modalProps} />,
    [DialogTypes.Transfer]: <TransferDialog {...modalProps} />,
    [DialogTypes.Triggers]: <TriggersDialog {...modalProps} />,
    [DialogTypes.SharePNLAnalytics]: <SharePNLAnalyticsDialog {...modalProps} />,
    [DialogTypes.Unstake]: <UnstakeDialog {...modalProps} />,
    [DialogTypes.Withdraw]: <WithdrawDialog {...modalProps} />,
    [DialogTypes.WithdrawalGated]: <WithdrawalGateDialog {...modalProps} />,
  }[type];
};
