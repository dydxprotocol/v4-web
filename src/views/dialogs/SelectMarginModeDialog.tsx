import { DialogProps, SelectMarginModeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { SelectMarginModeForm } from '../forms/SelectMarginModeForm';

export const SelectMarginModeDialog = ({ setIsOpen }: DialogProps<SelectMarginModeDialogProps>) => {
  const stringGetter = useStringGetter();
  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.MARGIN_MODE })}>
      <SelectMarginModeForm onChangeMarginMode={() => setIsOpen?.(false)} />
    </Dialog>
  );
};
