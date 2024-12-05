import { DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

export const DepositDialog2 = ({ setIsOpen }: DialogProps<{}>) => {
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <div>hello world</div>
    </Dialog>
  );
};
