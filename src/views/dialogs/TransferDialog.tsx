import { DialogProps, TransferDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { TransferForm } from '@/views/forms/TransferForm';

export const TransferDialog = ({ selectedAsset, setIsOpen }: DialogProps<TransferDialogProps>) => {
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.TRANSFER })}
      tw="[--dialog-content-paddingTop:--default-border-width]"
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <TransferForm selectedAsset={selectedAsset} onDone={() => setIsOpen(false)} />
    </Dialog>
  );
};
