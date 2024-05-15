import { useEffect } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { AbacusApiStatus } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useApiState, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

import { getSelectedNetwork } from '@/state/appSelectors';
import { closeDialog } from '@/state/dialogs';
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
      <$Content>
        <p>{statusErrorMessage?.body}</p>
        {isDev && <NetworkSelectMenu />}
      </$Content>
    </Dialog>
  );
};
const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

const $Link = styled(Link)`
  display: contents;
  --link-color: var(--color-accent);
`;
