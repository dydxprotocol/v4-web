import { useCallback } from 'react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

export const CheckEmailDialog = ({
  onClose,
  setIsOpen,
}: {
  onClose: () => void;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const stringGetter = useStringGetter();

  const modifiedSetIsOpen = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);

      if (!isOpen) {
        onClose();
      }
    },
    [onClose, setIsOpen]
  );

  return (
    <Dialog isOpen setIsOpen={modifiedSetIsOpen} title={<div />}>
      <div tw="column justify-items-center gap-0.5 text-center">
        <Icon tw="size-3 text-color-text-2" iconName={IconName.EmailStroke} />
        <span tw="text-color-text-2 font-medium-medium">
          {stringGetter({ key: STRING_KEYS.CHECK_EMAIL_TITLE })}
        </span>
        <p tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.CHECK_EMAIL_DESCRIPTION })}</p>
        <Button
          tw="mt-1"
          type={ButtonType.Button}
          action={ButtonAction.SimplePrimary}
          size={ButtonSize.Small}
          shape={ButtonShape.Pill}
        >
          <Icon iconName={IconName.Resend} />
          {stringGetter({ key: STRING_KEYS.RESEND })}
        </Button>
      </div>
    </Dialog>
  );
};
