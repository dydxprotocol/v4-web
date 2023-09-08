import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';
import { Close } from '@radix-ui/react-dialog';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useAccounts, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { closeDialog } from '@/state/dialogs';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const DisconnectDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();

  const { disconnect } = useAccounts();

  const onCancel = () => {
    dispatch(closeDialog());
  };

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Disconnect">
      <Styled.Content>
        <p>Are you sure you want to disconnect your account?</p>
        <Styled.ButtonRow>
          <Close asChild>
            <Button action={ButtonAction.Destroy} onClick={disconnect}>
              {stringGetter({ key: STRING_KEYS.DISCONNECT })}
            </Button>
          </Close>
          <Close asChild>
            <Button onClick={onCancel}>{stringGetter({ key: STRING_KEYS.CANCEL })}</Button>
          </Close>
        </Styled.ButtonRow>
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ButtonRow = styled.div`
  ${layoutMixins.row}

  gap: 0.5rem;
  justify-content: end;
`;

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
