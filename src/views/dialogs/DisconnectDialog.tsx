import { Close } from '@radix-ui/react-dialog';

import { ButtonAction } from '@/constants/buttons';
import { DialogProps, DisconnectWalletDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

export const DisconnectDialog = ({ setIsOpen }: DialogProps<DisconnectWalletDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { disconnect } = useAccounts();

  const onCancel = () => {
    dispatch(closeDialog());
  };

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.DISCONNECT })}>
      <div tw="gap-1 column">
        <p>{stringGetter({ key: STRING_KEYS.DISCONNECT_CONFIRMATION })}</p>
        <div tw="gap-0.5 row [justify-content:end]">
          <Close asChild>
            <Button action={ButtonAction.Destroy} onClick={disconnect}>
              {stringGetter({ key: STRING_KEYS.DISCONNECT })}
            </Button>
          </Close>
          <Close asChild>
            <Button onClick={onCancel}>{stringGetter({ key: STRING_KEYS.CANCEL })}</Button>
          </Close>
        </div>
      </div>
    </Dialog>
  );
};
