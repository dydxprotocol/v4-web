import { IndexerSubaccountResponseObject } from '@/types/indexer/indexerApiGen';
import {
  IndexerWsParentSubaccountSubscribedResponse,
  IndexerWsParentSubaccountUpdateObject,
} from '@/types/indexer/indexerManual';
import { keyBy } from 'lodash';

import { type RootState, type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { setParentSubaccountRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { createStoreEffect } from '../createStoreEffect';
import { Loadable, loadableLoaded, loadablePending } from '../loadable';
import { selectWebsocketUrl } from '../socketSelectors';
import { ChildSubaccountData, ParentSubaccountData } from '../types';
import { IndexerWebsocket } from './indexerWebsocket';
import { IndexerWebsocketManager } from './indexerWebsocketManager';
import { WebsocketDerivedValue } from './websocketDerivedValue';

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
  subaccount: string,
  onChange: (val: Loadable<ParentSubaccountData>) => void
) {
  return new WebsocketDerivedValue<Loadable<ParentSubaccountData>>(
    websocket,
    {
      channel: 'v4_parent_subaccounts',
      id: `${address}/${subaccount}`,
      handleBaseData: (baseMessage) => {
        const message = baseMessage as IndexerWsParentSubaccountSubscribedResponse;
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
        const updates = baseUpdates as IndexerWsParentSubaccountUpdateObject[];
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

const getUserWalletAddress = (state: RootState) => state.account.wallet?.walletAddress;
const getUserSubaccount = (state: RootState) => state.account.subaccount?.subaccountNumber;
const selectParentSubaccountInfo = createAppSelector(
  selectWebsocketUrl,
  getUserWalletAddress,
  getUserSubaccount,
  (wsUrl, wallet, subaccount) => ({ wsUrl, wallet, subaccount })
);

export function setUpParentSubaccount(store: RootStore) {
  return createStoreEffect(store, selectParentSubaccountInfo, ({ subaccount, wallet, wsUrl }) => {
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
    };
  });
}
