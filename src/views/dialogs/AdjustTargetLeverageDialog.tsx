import { AdjustTargetLeverageDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { AdjustTargetLeverageForm } from '../forms/AdjustTargetLeverageForm';

export const AdjustTargetLeverageDialog = ({
  setIsOpen,
}: DialogProps<AdjustTargetLeverageDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.ADJUST_TARGET_LEVERAGE })}
    >
      <div tw="column gap-1">
        <AdjustTargetLeverageForm onSetTargetLeverage={() => setIsOpen?.(false)} />
      </div>
    </Dialog>
  );
};
