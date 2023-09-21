import { useEffect } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { AbacusApiStatus } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { useApiState, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

import { closeDialog } from '@/state/dialogs';

import { getSelectedNetwork } from '@/state/appSelectors';
import { getActiveDialog } from '@/state/dialogsSelectors';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const ExchangeOfflineDialog = ({ preventClose, setIsOpen }: ElementProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { status, statusErrorMessage } = useApiState();
  const selectedNetwork = useSelector(getSelectedNetwork);
  const activeDialog = useSelector(getActiveDialog, shallowEqual);

  useEffect(() => {
    if (activeDialog?.type === DialogTypes.ExchangeOffline && status === AbacusApiStatus.NORMAL) {
      dispatch(closeDialog());
    }
  }, [status, selectedNetwork]);

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.UNAVAILABLE })}
    >
      <Styled.Content>
        <p>{statusErrorMessage}</p>
        {import.meta.env.MODE !== 'production' && <NetworkSelectMenu />}
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

Styled.Link = styled(Link)`
  display: contents;
  --link-color: var(--color-accent);
`;
