import { useDispatch, useSelector } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';

import { closeDialog, openDialog } from '@/state/dialogs';

import { getActiveDialog } from '@/state/dialogsSelectors';

import { ClosePositionDialog } from '@/views/dialogs/ClosePositionDialog';
import { DepositDialog } from '@/views/dialogs/DepositDialog';
import { DisconnectDialog } from '@/views/dialogs/DisconnectDialog';
import { ExchangeOfflineDialog } from '@/views/dialogs/ExchangeOfflineDialog';
import { HelpDialog } from '@/views/dialogs/HelpDialog';
import { MnemonicExportDialog } from '@/views/dialogs/MnemonicExportDialog';
import { MobileSignInDialog } from '@/views/dialogs/MobileSignInDialog';
import { OnboardingDialog } from '@/views/dialogs/OnboardingDialog';
import { ReceiveDialog } from '@/views/dialogs/ReceiveDialog';
import { TradeDialog } from '@/views/dialogs/TradeDialog';
import { TransferDialog } from '@/views/dialogs/TransferDialog';
import { UnauthorizedDialog } from '@/views/dialogs/UnauthorizedDialog';
import { WithdrawDialog } from '@/views/dialogs/WithdrawDialog';

import { OrderDetailsDialog } from '@/views/dialogs/DetailsDialog/OrderDetailsDialog';
import { FillDetailsDialog } from '@/views/dialogs/DetailsDialog/FillDetailsDialog';

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
    [DialogTypes.ClosePosition]: <ClosePositionDialog {...modalProps} />,
    [DialogTypes.Deposit]: <DepositDialog {...modalProps} />,
    [DialogTypes.DisconnectWallet]: <DisconnectDialog {...modalProps} />,
    [DialogTypes.ExchangeOffline]: <ExchangeOfflineDialog {...modalProps} />,
    [DialogTypes.FillDetails]: <FillDetailsDialog {...modalProps} />,
    [DialogTypes.Help]: <HelpDialog {...modalProps} />,
    [DialogTypes.MnemonicExport]: <MnemonicExportDialog {...modalProps} />,
    [DialogTypes.MobileSignIn]: <MobileSignInDialog {...modalProps} />,
    [DialogTypes.Onboarding]: <OnboardingDialog {...modalProps} />,
    [DialogTypes.OrderDetails]: <OrderDetailsDialog {...modalProps} />,
    [DialogTypes.Receive]: <ReceiveDialog {...modalProps} />,
    [DialogTypes.Trade]: <TradeDialog {...modalProps} />,
    [DialogTypes.Transfer]: <TransferDialog {...modalProps} />,
    [DialogTypes.Unauthorized]: <UnauthorizedDialog {...modalProps} />,
    [DialogTypes.Withdraw]: <WithdrawDialog {...modalProps} />,
  }[type];
};
