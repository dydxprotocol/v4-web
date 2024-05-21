import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { DepositDialogContent } from './DepositDialog/DepositDialogContent';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const DepositDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <DepositDialogContent />
    </Dialog>
  );
};
