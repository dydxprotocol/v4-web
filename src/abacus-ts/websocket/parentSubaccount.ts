import { IndexerSubaccountResponseObject } from '@/types/indexer/indexerApiGen';
import {
  isWsParentSubaccountSubscribed,
  isWsParentSubaccountUpdates,
} from '@/types/indexer/indexerChecks';
import { keyBy } from 'lodash';

import { type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { setParentSubaccountRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { accountRefreshSignal } from '../accountRefreshSignal';
import { createStoreEffect } from '../lib/createStoreEffect';
import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { ChildSubaccountData, ParentSubaccountData } from '../rawTypes';
import { selectParentSubaccountInfo, selectWebsocketUrl } from '../socketSelectors';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { IndexerWebsocketManager } from './lib/indexerWebsocketManager';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

function isValidSubaccount(childSubaccount: IndexerSubaccountResponseObject) {
  return (
    Object.keys(childSubaccount.assetPositions).length > 0 ||
    Object.keys(childSubaccount.openPerpetualPositions).length > 0
  );
}

function convertToStoredChildSubaccount({
  address,
  subaccountNumber,
  assetPositions,
  openPerpetualPositions,
}: IndexerSubaccountResponseObject): ChildSubaccountData {
  return {
    address,
    subaccountNumber,
    assetPositions,
    openPerpetualPositions,
  };
}

function freshChildSubaccount({
  address,
  subaccountNumber,
}: {
  address: string;
  subaccountNumber: number;
}): ChildSubaccountData {
  return {
    address,
    subaccountNumber,
    assetPositions: {},
    openPerpetualPositions: {},
  };
}

function accountWebsocketValue(
  websocket: IndexerWebsocket,
  address: string,
  parentSubaccount: string,
  onChange: (val: Loadable<ParentSubaccountData>) => void
) {
  return new WebsocketDerivedValue<Loadable<ParentSubaccountData>>(
    websocket,
    {
      channel: 'v4_parent_subaccounts',
      id: `${address}/${parentSubaccount}`,
      handleBaseData: (baseMessage) => {
        const message = isWsParentSubaccountSubscribed(baseMessage);
        accountRefreshSignal.notify();

        return loadableLoaded({
          address: message.subaccount.address,
          parentSubaccount: message.subaccount.parentSubaccountNumber,
          childSubaccounts: keyBy(
            message.subaccount.childSubaccounts
              .filter(isValidSubaccount)
              .map(convertToStoredChildSubaccount),
            (c) => c.subaccountNumber
          ),
          ephemeral: {
            orders: keyBy(message.orders, (o) => o.id),
          },
        });
      },
      handleUpdates: (baseUpdates, value, fullMessage) => {
        const updates = isWsParentSubaccountUpdates(baseUpdates);
        const subaccountNumber = fullMessage?.subaccountNumber as number | undefined;
        if (value.data == null || updates.length === 0 || subaccountNumber == null) {
          return value;
        }
        const returnValue = { ...value.data };
        updates.forEach((update) => {
          if (update.assetPositions != null) {
            update.assetPositions.forEach((positionUpdate) => {
              returnValue.childSubaccounts[positionUpdate.subaccountNumber] ??=
                freshChildSubaccount({
                  address,
                  subaccountNumber: positionUpdate.subaccountNumber,
                });

              returnValue.childSubaccounts[positionUpdate.subaccountNumber]!.assetPositions[
                positionUpdate.assetId
              ] = {
                ...(returnValue.childSubaccounts[positionUpdate.subaccountNumber]!.assetPositions[
                  positionUpdate.assetId
                ] ?? {}),
                ...positionUpdate,
              };
            });
          }
          if (update.perpetualPositions != null) {
            update.perpetualPositions.forEach((positionUpdate) => {
              returnValue.childSubaccounts[positionUpdate.subaccountNumber] ??=
                freshChildSubaccount({
                  address,
                  subaccountNumber: positionUpdate.subaccountNumber,
                });

              returnValue.childSubaccounts[positionUpdate.subaccountNumber]!.openPerpetualPositions[
                positionUpdate.market
              ] = {
                ...(returnValue.childSubaccounts[positionUpdate.subaccountNumber]!
                  .openPerpetualPositions[positionUpdate.market] ?? {}),
                ...positionUpdate,
              };
            });
          }
          if (update.tradingReward != null) {
            returnValue.ephemeral.tradingRewards ??= [];
            returnValue.ephemeral.tradingRewards = [
              ...returnValue.ephemeral.tradingRewards,
              update.tradingReward,
            ];
          }
          if (update.fills != null) {
            returnValue.ephemeral.fills ??= [];
            returnValue.ephemeral.fills = [
              ...returnValue.ephemeral.fills,
              ...update.fills.map((f) => ({ ...f, subaccountNumber })),
            ];
          }
          if (update.orders != null) {
            returnValue.ephemeral.orders ??= {};
            returnValue.ephemeral.orders = {
              ...returnValue.ephemeral.orders,
              ...keyBy(update.orders, (o) => o.id ?? ''),
            };
          }
          if (update.transfers != null) {
            returnValue.ephemeral.transfers ??= [];
            returnValue.ephemeral.transfers = [
              ...returnValue.ephemeral.transfers,
              update.transfers,
            ];
          }
        });
        return { ...value, data: returnValue };
      },
    },
    loadablePending(),
    onChange
  );
}

const selectParentSubaccount = createAppSelector(
  selectWebsocketUrl,
  selectParentSubaccountInfo,
  (wsUrl, { wallet, subaccount }) => ({ wsUrl, wallet, subaccount })
);

export function setUpParentSubaccount(store: RootStore) {
  return createStoreEffect(store, selectParentSubaccount, ({ subaccount, wallet, wsUrl }) => {
    if (!isTruthy(wallet) || subaccount == null) {
      return undefined;
    }
    const thisTracker = accountWebsocketValue(
      IndexerWebsocketManager.use(wsUrl),
      wallet,
      subaccount.toString(),
      (val) => store.dispatch(setParentSubaccountRaw(val))
    );

    return () => {
      thisTracker.teardown();
      IndexerWebsocketManager.markDone(wsUrl);
      store.dispatch(setParentSubaccountRaw(loadableIdle()));
    };
  });
}
