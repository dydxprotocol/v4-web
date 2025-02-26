import styled from 'styled-components';

import { DialogProps, TransferStatusDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { isDeposit, isWithdraw } from '@/state/transfers';
import { selectTransfer } from '@/state/transfersSelectors';

import { DepositStatus } from './DepositDialog2/DepositStatus';
import { WithdrawStatus } from './WithdrawDialog2/WithdrawStatus';

export const TransferStatusDialog = ({
  setIsOpen,
  transferId,
}: DialogProps<TransferStatusDialogProps>) => {
  const stringGetter = useStringGetter();

  const transfer = useParameterizedSelector(selectTransfer, transferId);

  const title = transfer
    ? isDeposit(transfer)
      ? stringGetter({ key: STRING_KEYS.DEPOSIT })
      : stringGetter({ key: STRING_KEYS.WITHDRAW })
    : stringGetter({ key: STRING_KEYS.TRANSFER });

  const content =
    transfer && isDeposit(transfer) ? (
      <DepositStatus
        onClose={() => setIsOpen(false)}
        txHash={transfer.txHash}
        chainId={transfer.chainId}
      />
    ) : transfer && isWithdraw(transfer) ? (
      <WithdrawStatus onClose={() => setIsOpen(false)} id={transferId} />
    ) : null;

  return (
    <$Dialog
      isOpen
      preventCloseOnOverlayClick
      withAnimation
      hasHeaderBorder
      setIsOpen={setIsOpen}
      slotIcon={<div />} // Empty icon to help with center alignment of title
      title={<div tw="text-center">{title}</div>}
      placement={DialogPlacement.Default}
    >
      {content}
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
`;
