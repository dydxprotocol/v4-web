import { DialogProps, RateLimitDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

export const RateLimitDialog = ({ preventClose, setIsOpen }: DialogProps<RateLimitDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_TITLE })}
      slotIcon={<Icon iconName={IconName.Warning} tw="text-warning" />}
    >
      <div tw="gap-1 column">
        {stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE })}
      </div>
    </Dialog>
  );
};
