import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { SelectMarginModeForm } from '../forms/SelectMarginModeForm';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const SelectMarginModeDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.MARGIN_MODE })}>
      <SelectMarginModeForm onChangeMarginMode={() => setIsOpen?.(false)} />
    </Dialog>
  );
};
