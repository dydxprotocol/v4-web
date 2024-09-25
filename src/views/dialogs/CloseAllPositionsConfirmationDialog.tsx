import { useCallback } from 'react';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { CloseAllPositionsConfirmationDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

export const CloseAllPositionsConfirmationDialog = ({
  setIsOpen,
}: DialogProps<CloseAllPositionsConfirmationDialogProps>) => {
  const stringGetter = useStringGetter();
  const { closeAllPositions } = useSubaccount();

  const onSubmit = useCallback(() => {
    closeAllPositions();
    setIsOpen?.(false);
  }, [closeAllPositions, setIsOpen]);

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.CONFIRM })}>
      <form onSubmit={onSubmit} tw="flex flex-col gap-0.75">
        <div>{stringGetter({ key: STRING_KEYS.ARE_YOU_SURE_CLOSE_MULTI_POSITION_ALL })}</div>
        <Button action={ButtonAction.Destroy} type={ButtonType.Submit} tw="w-full">
          {stringGetter({ key: STRING_KEYS.CLOSE_ALL_POSITIONS })}
        </Button>
      </form>
    </Dialog>
  );
};
