import { produce } from 'immer';
import { isEmpty, keyBy } from 'lodash';

import {
  IndexerAssetPositionResponseObject,
  IndexerOrderResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerSubaccountResponseObject,
} from '@/types/indexer/indexerApiGen';
import {
  isWsParentSubaccountSubscribed,
  isWsParentSubaccountUpdates,
} from '@/types/indexer/indexerChecks';
import { IndexerWsOrderUpdate } from '@/types/indexer/indexerManual';

import { type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { setParentSubaccountRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

import { accountRefreshSignal } from '../accountRefreshSignal';
import { createStoreEffect } from '../lib/createStoreEffect';
import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { logAbacusTsError } from '../logs';
import { selectParentSubaccountInfo, selectWebsocketUrl } from '../socketSelectors';
import { ChildSubaccountData, ParentSubaccountData } from '../types/rawTypes';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
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

interface AccountValueArgsBase {
  address: string;
  parentSubaccountNumber: string;
}

function accountWebsocketValueCreator(
  websocket: IndexerWebsocket,
  { address, parentSubaccountNumber }: AccountValueArgsBase
) {
  return new WebsocketDerivedValue<Loadable<ParentSubaccountData>>(
    websocket,
    {
      channel: 'v4_parent_subaccounts',
      id: `${address}/${parentSubaccountNumber}`,
      handleBaseData: (baseMessage): Loadable<ParentSubaccountData> => {
        accountRefreshSignal.notify();

        // empty message means account has had no transfers yet, but it's still valid
        if (baseMessage == null || isEmpty(baseMessage)) {
          const parentSubaccountNumberParsed = MustBigNumber(parentSubaccountNumber).toNumber();
          return loadableLoaded({
            address,
            parentSubaccount: parentSubaccountNumberParsed,
            live: {},
            childSubaccounts: {
              [parentSubaccountNumberParsed]: freshChildSubaccount({
                address,
                subaccountNumber: parentSubaccountNumberParsed,
              }),
            },
          });
        }

        const message = isWsParentSubaccountSubscribed(baseMessage);
        return loadableLoaded({
          address: message.subaccount.address,
          parentSubaccount: message.subaccount.parentSubaccountNumber,
          childSubaccounts: keyBy(
            message.subaccount.childSubaccounts
              .filter(isValidSubaccount)
              .map(convertToStoredChildSubaccount),
            (c) => c.subaccountNumber
          ),
          live: {
            orders: keyBy(message.orders, (o) => o.id),
          },
        });
      },
      handleUpdates: (baseUpdates, value, fullMessage) => {
        const updates = isWsParentSubaccountUpdates(baseUpdates);
        const subaccountNumber = fullMessage?.subaccountNumber as number | undefined;
        if (value.data == null) {
          logAbacusTsError(
            'ParentSubaccountTracker',
            'found unexpectedly null base data in update'
          );
          return value;
        }
        if (updates.length === 0 || subaccountNumber == null) {
          return value;
        }
        const resultData = produce(value.data, (returnValue) => {
          updates.forEach((update) => {
            if (update.assetPositions != null) {
              update.assetPositions.forEach((positionUpdate) => {
                returnValue.childSubaccounts[positionUpdate.subaccountNumber] ??=
                  freshChildSubaccount({
                    address,
                    subaccountNumber: positionUpdate.subaccountNumber,
                  });

                const assetPositions =
                  returnValue.childSubaccounts[positionUpdate.subaccountNumber]!.assetPositions;

                if (assetPositions[positionUpdate.assetId] == null) {
                  assetPositions[positionUpdate.assetId] =
                    positionUpdate as IndexerAssetPositionResponseObject;
                } else {
                  assetPositions[positionUpdate.assetId] = {
                    ...(assetPositions[
                      positionUpdate.assetId
                    ] as IndexerAssetPositionResponseObject),
                    ...positionUpdate,
                  };
                }
              });
            }
            if (update.perpetualPositions != null) {
              update.perpetualPositions.forEach((positionUpdate) => {
                returnValue.childSubaccounts[positionUpdate.subaccountNumber] ??=
                  freshChildSubaccount({
                    address,
                    subaccountNumber: positionUpdate.subaccountNumber,
                  });

                const perpPositions =
                  returnValue.childSubaccounts[positionUpdate.subaccountNumber]!
                    .openPerpetualPositions;

                if (perpPositions[positionUpdate.market] == null) {
                  perpPositions[positionUpdate.market] =
                    positionUpdate as IndexerPerpetualPositionResponseObject;
                } else {
                  perpPositions[positionUpdate.market] = {
                    ...(perpPositions[
                      positionUpdate.market
                    ] as IndexerPerpetualPositionResponseObject),
                    ...positionUpdate,
                  };
                }
              });
            }
            if (update.tradingReward != null) {
              returnValue.live.tradingRewards ??= [];
              returnValue.live.tradingRewards = [
                ...returnValue.live.tradingRewards,
                update.tradingReward,
              ];
            }
            if (update.fills != null) {
              returnValue.live.fills ??= [];
              returnValue.live.fills = [
                ...returnValue.live.fills,
                ...update.fills.map((f) => ({
                  ...f,
                  subaccountNumber,
                  // NOTE: provides ticker in ws response instead of market for soem reason
                  market: f.market ?? ((f as any).ticker as string),
                })),
              ];
            }
            if (update.orders != null) {
              returnValue.live.orders = { ...(returnValue.live.orders ?? {}) };
              const allOrders = returnValue.live.orders;
              update.orders.forEach((o) => {
                const previousOrder = allOrders[o.id];
                if (previousOrder == null) {
                  allOrders[o.id] = {
                    ...(o as IndexerOrderResponseObject),
                    subaccountNumber,
                  };
                } else {
                  allOrders[o.id] = {
                    ...(allOrders[o.id] as IndexerOrderResponseObject),
                    ...(o as IndexerWsOrderUpdate),
                    subaccountNumber,
                  };
                }
              });
            }
            if (update.transfers != null) {
              returnValue.live.transfers ??= [];
              returnValue.live.transfers = [...returnValue.live.transfers, update.transfers];
            }
          });
        });

        return { ...value, data: resultData };
      },
    },
    loadablePending()
  );
}

const AccountValueManager = makeWsValueManager(accountWebsocketValueCreator);

const selectParentSubaccount = createAppSelector(
  [selectWebsocketUrl, selectParentSubaccountInfo],
  (wsUrl, { wallet, subaccount }) => ({ wsUrl, wallet, subaccount })
);

export function setUpParentSubaccount(store: RootStore) {
  return createStoreEffect(store, selectParentSubaccount, ({ subaccount, wallet, wsUrl }) => {
    if (!isTruthy(wallet) || subaccount == null) {
      return undefined;
    }

    const unsub = subscribeToWsValue(
      AccountValueManager,
      { wsUrl, address: wallet, parentSubaccountNumber: subaccount.toString() },
      (val) => store.dispatch(setParentSubaccountRaw(val))
    );

    return () => {
      unsub();
      store.dispatch(setParentSubaccountRaw(loadableIdle()));
    };
  });
}
