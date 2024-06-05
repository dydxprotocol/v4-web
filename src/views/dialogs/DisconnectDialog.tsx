import { Close } from '@radix-ui/react-dialog';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const DisconnectDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { disconnect } = useAccounts();

  const onCancel = () => {
    dispatch(closeDialog());
  };

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.DISCONNECT })}>
      <$Content>
        <p>{stringGetter({ key: STRING_KEYS.DISCONNECT_CONFIRMATION })}</p>
        <$ButtonRow>
          <Close asChild>
            <Button action={ButtonAction.Destroy} onClick={disconnect}>
              {stringGetter({ key: STRING_KEYS.DISCONNECT })}
            </Button>
          </Close>
          <Close asChild>
            <Button onClick={onCancel}>{stringGetter({ key: STRING_KEYS.CANCEL })}</Button>
          </Close>
        </$ButtonRow>
      </$Content>
    </Dialog>
  );
};
const $ButtonRow = styled.div`
  ${layoutMixins.row}

  gap: 0.5rem;
  justify-content: end;
`;

const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
