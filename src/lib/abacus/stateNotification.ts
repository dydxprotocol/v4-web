// eslint-disable-next-line max-classes-per-file
import { kollections } from '@dydxprotocol/v4-abacus';
import { fromPairs, throttle } from 'lodash';

import type {
  AbacusNotification,
  AbacusStateNotificationProtocol,
  AccountBalance,
  MarketOrderbook,
  Nullable,
  ParsingErrors,
  PerpetualMarket,
  PerpetualState,
  PerpetualStateChanges,
  SubaccountOrder,
} from '@/constants/abacus';
import { Changes } from '@/constants/abacus';
import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import {
  setCompliance,
  setFills,
  setHistoricalPnl,
  setRestrictionType,
  setStakingBalances,
  setStakingDelegations,
  setStakingRewards,
  setSubaccount,
  setTradingRewards,
  setUnbondingDelegations,
} from '@/state/account';
import { setInputs } from '@/state/inputs';
import { setLatestOrder, updateFilledOrders, updateOrders } from '@/state/localOrders';
import { updateNotifications } from '@/state/notifications';
import { setMarkets, setOrderbook } from '@/state/perpetuals';

import { track } from '../analytics/analytics';
import { isTruthy } from '../isTruthy';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  private store: RootStore | undefined;

  constructor() {
    this.store = undefined;
  }

  private throttledOrderbookUpdateByMarketId: {
    [marketId: string]: (orderbook: MarketOrderbook) => void;
  } = {};

  environmentsChanged(): void {}

  notificationsChanged(notifications: kollections.List<AbacusNotification>): void {
    this.store?.dispatch(updateNotifications(notifications.toArray()));
  }

  stateChanged(
    updatedState: Nullable<PerpetualState>,
    incomingChanges: Nullable<PerpetualStateChanges>
  ): void {
    if (!this.store) return;
    const { dispatch } = this.store;
    const changes = new Set(incomingChanges?.changes.toArray() ?? []);
    const marketIds = incomingChanges?.markets?.toArray();
    const subaccountNumbers = incomingChanges?.subaccountNumbers?.toArray();

    if (updatedState) {
      if (changes.has(Changes.accountBalances)) {
        if (updatedState.account?.stakingBalances) {
          const stakingBalances: Record<string, AccountBalance> = fromPairs(
            updatedState.account.stakingBalances.toArray().map(({ k, v }) => [k, v])
          );
          dispatch(setStakingBalances(stakingBalances));
        }
        if (updatedState.account?.stakingDelegations) {
          dispatch(setStakingDelegations(updatedState.account.stakingDelegations.toArray()));
        }
        if (updatedState.account?.unbondingDelegation) {
          dispatch(setUnbondingDelegations(updatedState.account.unbondingDelegation.toArray()));
        }
        if (updatedState.account?.stakingRewards) {
          dispatch(setStakingRewards(updatedState.account.stakingRewards));
        }
      }

      if (changes.has(Changes.tradingRewards)) {
        if (updatedState.account?.tradingRewards) {
          dispatch(setTradingRewards(updatedState.account.tradingRewards));
        }
      }

      if (changes.has(Changes.input)) {
        dispatch(setInputs(updatedState.input));
      }

      if (changes.has(Changes.markets)) {
        dispatch(
          setMarkets({
            markets: Object.fromEntries(
              (marketIds ?? updatedState.marketIds()?.toArray() ?? [])
                .map((marketId: string): undefined | [string, PerpetualMarket] => {
                  const marketData = updatedState.market(marketId);
                  if (marketData == null) {
                    return undefined;
                  }
                  return [marketId, marketData];
                })
                .filter(isTruthy)
            ),
            update: !!marketIds,
          })
        );
      }

      if (changes.has(Changes.restriction)) {
        dispatch(setRestrictionType(updatedState.restriction));
      }

      if (changes.has(Changes.compliance) && updatedState.compliance) {
        dispatch(setCompliance(updatedState.compliance));
      }

      subaccountNumbers?.forEach((subaccountId: number) => {
        const isChildSubaccount = subaccountId >= NUM_PARENT_SUBACCOUNTS;

        if (changes.has(Changes.subaccount)) {
          const subaccountData = updatedState.subaccount(subaccountId);
          if (!isChildSubaccount) {
            dispatch(setSubaccount(subaccountData));
            dispatch(updateOrders(subaccountData?.orders?.toArray() ?? []));
          }
        }

        if (changes.has(Changes.fills)) {
          const fills = updatedState.subaccountFills(subaccountId)?.toArray() ?? [];
          if (isChildSubaccount) {
            dispatch(setFills(fills));
            dispatch(updateFilledOrders(fills));
          }
        }

        if (changes.has(Changes.historicalPnl)) {
          const historicalPnl = updatedState.subaccountHistoricalPnl(subaccountId)?.toArray() ?? [];

          if (isChildSubaccount) {
            dispatch(setHistoricalPnl(historicalPnl));
          }
        }
      });

      marketIds?.forEach((market: string) => {
        if (changes.has(Changes.orderbook)) {
          this.throttledOrderbookUpdateByMarketId[market] ??= throttle(
            (orderbook) => this.store?.dispatch(setOrderbook({ orderbook, marketId: market })),
            timeUnits.second / 3
          );

          const orderbook = updatedState.marketOrderbook(market);
          if (orderbook) {
            this.throttledOrderbookUpdateByMarketId[market](orderbook);
          }
        }
      });
    }
  }

  lastOrderChanged(order: SubaccountOrder) {
    this.store?.dispatch(setLatestOrder(order));
  }

  errorsEmitted(errors: ParsingErrors) {
    const arr = errors.toArray();

    track(AnalyticsEvents.WebsocketParseError({ message: arr.map((a) => a.message).join(', ') }));
    // eslint-disable-next-line no-console
    console.error('parse errors', arr);
  }

  apiStateChanged() {}

  setStore = (store: RootStore) => {
    this.store = store;
  };
}

export default AbacusStateNotifier;

export class NoOpAbacusStateNotifier implements AbacusStateNotificationProtocol {
  environmentsChanged(): void {}

  notificationsChanged(): void {}

  stateChanged(): void {}

  lastOrderChanged() {}

  errorsEmitted() {}

  apiStateChanged() {}

  setStore = () => {};
}
