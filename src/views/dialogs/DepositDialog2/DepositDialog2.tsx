import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

export const DepositDialog2 = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      hasHeaderBorder
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      New deposit flow goes here!
    </Dialog>
  );
};
