import { useCallback, useEffect } from 'react';

import { shallowEqual } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialog, openDialog } from '@/state/dialogs';
import { getActiveDialog } from '@/state/dialogsSelectors';

export const useCommandMenu = () => {
  const dispatch = useAppDispatch();
  const activeDialog = useAppSelector(getActiveDialog, shallowEqual);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
        const isCommandDialogOpen = activeDialog && DialogTypes.is.GlobalCommand(activeDialog);
        if (isCommandDialogOpen) {
          dispatch(closeDialog());
        } else {
          dispatch(openDialog(DialogTypes.GlobalCommand()));
        }
      }
    },
    [activeDialog]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
