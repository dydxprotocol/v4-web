import type { PayloadAction } from '@reduxjs/toolkit';

import { AbacusApiStatus } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { isDev } from '@/constants/networks';

import { setApiState, setSelectedNetwork } from '@/state/app';
import { resetPerpetualsState } from '@/state/perpetuals';

import abacusStateManager from '@/lib/abacus';

import { openDialog } from './dialogs';
import { getActiveDialog } from './dialogsSelectors';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);

  const { type, payload } = action;

  switch (type) {
    case setSelectedNetwork.type: {
      store.dispatch(resetPerpetualsState());
      abacusStateManager.switchNetwork(payload);
      break;
    }
    case setApiState.type: {
      const { status } = payload ?? {};
      const { type: activeDialogType } = getActiveDialog(store.getState()) ?? {};

      if (status !== AbacusApiStatus.NORMAL && activeDialogType !== DialogTypes.ExchangeOffline) {
        store.dispatch(
          openDialog({
            type: DialogTypes.ExchangeOffline,
            dialogProps: { preventClose: !isDev },
          })
        );
      }

      break;
    }
    default: {
      break;
    }
  }
};
