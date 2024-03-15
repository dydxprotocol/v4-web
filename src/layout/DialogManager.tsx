import { useDispatch, useSelector } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';

import { AdjustIsolatedMarginDialog } from '@/views/dialogs/AdjustIsolatedMarginDialog';
import { AdjustTargetLeverageDialog } from '@/views/dialogs/AdjustTargetLeverageDialog';
import { ClosePositionDialog } from '@/views/dialogs/ClosePositionDialog';
import { DepositDialog } from '@/views/dialogs/DepositDialog';
import { FillDetailsDialog } from '@/views/dialogs/DetailsDialog/FillDetailsDialog';
import { OrderDetailsDialog } from '@/views/dialogs/DetailsDialog/OrderDetailsDialog';
import { DisconnectDialog } from '@/views/dialogs/DisconnectDialog';
import { DisplaySettingsDialog } from '@/views/dialogs/DisplaySettingsDialog';
import { ExchangeOfflineDialog } from '@/views/dialogs/ExchangeOfflineDialog';
import { ExternalLinkDialog } from '@/views/dialogs/ExternalLinkDialog';
import { ExternalNavKeplrDialog } from '@/views/dialogs/ExternalNavKeplrDialog';
import { ExternalNavStrideDialog } from '@/views/dialogs/ExternalNavStrideDialog';
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
import { TradeDialog } from '@/views/dialogs/TradeDialog';
import { TransferDialog } from '@/views/dialogs/TransferDialog';
import { WithdrawDialog } from '@/views/dialogs/WithdrawDialog';
import { WithdrawalGateDialog } from '@/views/dialogs/WithdrawalGateDialog';

import { closeDialog, openDialog } from '@/state/dialogs';
import { getActiveDialog } from '@/state/dialogsSelectors';

export const DialogManager = () => {
  const dispatch = useDispatch();
  const activeDialog = useSelector(getActiveDialog);

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
    [DialogTypes.Deposit]: <DepositDialog {...modalProps} />,
    [DialogTypes.DisplaySettings]: <DisplaySettingsDialog {...modalProps} />,
    [DialogTypes.DisconnectWallet]: <DisconnectDialog {...modalProps} />,
    [DialogTypes.ExchangeOffline]: <ExchangeOfflineDialog {...modalProps} />,
    [DialogTypes.FillDetails]: <FillDetailsDialog {...modalProps} />,
    [DialogTypes.Help]: <HelpDialog {...modalProps} />,
    [DialogTypes.ExternalNavKeplr]: <ExternalNavKeplrDialog {...modalProps} />,
    [DialogTypes.ExternalLink]: <ExternalLinkDialog {...modalProps} />,
    [DialogTypes.ExternalNavStride]: <ExternalNavStrideDialog {...modalProps} />,
    [DialogTypes.MnemonicExport]: <MnemonicExportDialog {...modalProps} />,
    [DialogTypes.MobileSignIn]: <MobileSignInDialog {...modalProps} />,
    [DialogTypes.MobileDownload]: <MobileDownloadDialog {...modalProps} />,
    [DialogTypes.Onboarding]: <OnboardingDialog {...modalProps} />,
    [DialogTypes.OrderDetails]: <OrderDetailsDialog {...modalProps} />,
    [DialogTypes.Preferences]: <PreferencesDialog {...modalProps} />,
    [DialogTypes.RateLimit]: <RateLimitDialog {...modalProps} />,
    [DialogTypes.RestrictedGeo]: <RestrictedGeoDialog {...modalProps} />,
    [DialogTypes.RestrictedWallet]: <RestrictedWalletDialog {...modalProps} />,
    [DialogTypes.SelectMarginMode]: <SelectMarginModeDialog {...modalProps} />,
    [DialogTypes.Trade]: <TradeDialog {...modalProps} />,
    [DialogTypes.Transfer]: <TransferDialog {...modalProps} />,
    [DialogTypes.Withdraw]: <WithdrawDialog {...modalProps} />,
    [DialogTypes.WithdrawalGated]: <WithdrawalGateDialog {...modalProps} />,
    [DialogTypes.ManageFunds]: <ManageFundsDialog {...modalProps} />,
    [DialogTypes.NewMarketMessageDetails]: <NewMarketMessageDetailsDialog {...modalProps} />,
    [DialogTypes.NewMarketAgreement]: <NewMarketAgreementDialog {...modalProps} />,
  }[type];
};
