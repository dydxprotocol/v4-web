import {
  IndexerWsParentSubaccountSubscribedResponse,
  IndexerWsParentSubaccountUpdateObject,
} from '@/types/indexer/indexerManual';

import { RootState, RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';

import { createStoreEffect } from '../createStoreEffect';
import { Loadable, loadableLoaded, loadablePending } from '../loadable';
import { selectWebsocketUrl } from '../socketSelectors';
import { MarketsData } from '../types';
import { IndexerWebsocket } from './indexerWebsocket';
import { IndexerWebsocketManager } from './indexerWebsocketManager';
import { WebsocketDerivedValue } from './websocketDerivedValue';

function accountWebsocketValue(
  websocket: IndexerWebsocket,
  address: string,
  subaccount: string,
  onChange: (val: Loadable<MarketsData>) => void
) {
  return new WebsocketDerivedValue<Loadable<MarketsData>>(
    websocket,
    {
      channel: 'v4_parent_subaccount',
      id: `${address}/${subaccount}`,
      handleBaseData: (baseMessage) => {
        const message = baseMessage as IndexerWsParentSubaccountSubscribedResponse;
        return loadableLoaded(message.markets);
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = baseUpdates as IndexerWsParentSubaccountUpdateObject[];
        let startingValue = value.data;
        return { ...value };
      },
    },
    loadablePending(),
    onChange
  );
}

const getUserWalletAddress = (state: RootState) => state.account.wallet?.walletAddress;
const getUserSubaccount = (state: RootState) => state.account.subaccount?.subaccountNumber;
const selectParentSubaccountInfo = createAppSelector(
  selectWebsocketUrl,
  getUserWalletAddress,
  getUserSubaccount,
  (wsUrl, wallet, subaccount) => ({ wsUrl, wallet, subaccount })
);

export function setUpAccount(store: RootStore) {
  return createStoreEffect(store, selectParentSubaccountInfo, ({ subaccount, wallet, wsUrl }) => {
    if (!isTruthy(wallet) || subaccount == null) {
      return undefined;
    }
    const thisTracker = accountWebsocketValue(
      IndexerWebsocketManager.use(wsUrl),
      wallet,
      subaccount.toString(),
      (val) => store.dispatch(SetRawAccount(val))
    );

    return () => {
      thisTracker.teardown();
      IndexerWebsocketManager.markDone(wsUrl);
    };
  });
}
