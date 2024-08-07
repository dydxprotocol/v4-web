import { DialogProps, TransferDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { TransferForm } from '@/views/forms/TransferForm';

export const TransferDialog = ({ selectedAsset, setIsOpen }: DialogProps<TransferDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.TRANSFER })}
      tw="[--dialog-content-paddingTop:--default-border-width]"
    >
      <TransferForm selectedAsset={selectedAsset} onDone={() => setIsOpen?.(false)} />
    </Dialog>
  );
};
