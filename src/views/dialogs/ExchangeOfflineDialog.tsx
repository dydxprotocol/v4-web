import { useEffect } from 'react';

import { shallowEqual } from 'react-redux';

import { AbacusApiStatus } from '@/constants/abacus';
import { DialogProps, DialogTypes, ExchangeOfflineDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useApiState } from '@/hooks/useApiState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';
import { getActiveDialog } from '@/state/dialogsSelectors';

export const ExchangeOfflineDialog = ({
  preventClose,
  setIsOpen,
}: DialogProps<ExchangeOfflineDialogProps>) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { status, statusErrorMessage } = useApiState();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const activeDialog = useAppSelector(getActiveDialog, shallowEqual);

  useEffect(() => {
    if (
      activeDialog != null &&
      DialogTypes.is.ExchangeOffline(activeDialog) &&
      status === AbacusApiStatus.NORMAL
    ) {
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
      <div tw="column gap-1">
        <p>{statusErrorMessage?.body}</p>
        {isDev && <NetworkSelectMenu />}
      </div>
    </Dialog>
  );
};
