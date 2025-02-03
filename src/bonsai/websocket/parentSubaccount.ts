import { produce } from 'immer';
import { isEmpty, keyBy } from 'lodash';

import {
  IndexerAssetPositionResponseObject,
  IndexerOrderResponseObject,
  IndexerPerpetualPositionResponseObject,
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
import {
  convertToStoredChildSubaccount,
  freshChildSubaccount,
  isValidSubaccount,
} from '../lib/subaccountUtils';
import { logBonsaiError } from '../logs';
import { selectParentSubaccountInfo, selectWebsocketUrl } from '../socketSelectors';
import { ParentSubaccountData } from '../types/rawTypes';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

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
        const parentSubaccountNumberParsed = MustBigNumber(parentSubaccountNumber).toNumber();

        // empty message means account has had no transfers yet, but it's still valid
        if (baseMessage == null || isEmpty(baseMessage)) {
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
        const result = {
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
        };
        if (result.childSubaccounts[parentSubaccountNumber] == null) {
          result.childSubaccounts[parentSubaccountNumber] = freshChildSubaccount({
            address,
            subaccountNumber: parentSubaccountNumberParsed,
          });
        }
        return loadableLoaded(result);
      },
      handleUpdates: (baseUpdates, value, fullMessage) => {
        const updates = isWsParentSubaccountUpdates(baseUpdates);
        const subaccountNumber = fullMessage?.subaccountNumber as number | undefined;
        if (value.data == null) {
          logBonsaiError('ParentSubaccountTracker', 'found unexpectedly null base data in update', {
            address,
            subaccountNumber,
          });
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

                if (assetPositions[positionUpdate.symbol] == null) {
                  assetPositions[positionUpdate.symbol] =
                    positionUpdate as IndexerAssetPositionResponseObject;
                } else {
                  assetPositions[positionUpdate.symbol] = {
                    ...(assetPositions[
                      positionUpdate.symbol
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
