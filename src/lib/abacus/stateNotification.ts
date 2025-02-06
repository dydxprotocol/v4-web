// eslint-disable-next-line max-classes-per-file
import { kollections } from '@dydxprotocol/v4-abacus';
import { fromPairs } from 'lodash';

import type {
  AbacusNotification,
  AbacusStateNotificationProtocol,
  AccountBalance,
  Nullable,
  ParsingErrors,
  PerpetualState,
  PerpetualStateChanges,
  SubaccountOrder,
} from '@/constants/abacus';
import { Changes } from '@/constants/abacus';
import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';

import { type RootStore } from '@/state/_store';
import {
  setCompliance,
  setRestrictionType,
  setStakingBalances,
  setStakingDelegations,
  setStakingRewards,
  setSubaccountForPostOrders,
  setTradingRewards,
  setUnbondingDelegations,
} from '@/state/account';
import { setInputs } from '@/state/inputs';
import { setLatestOrder } from '@/state/localOrders';
import { updateNotifications } from '@/state/notifications';
import { setAbacusHasMarkets } from '@/state/perpetuals';

import { track } from '../analytics/analytics';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  private store: RootStore | undefined;

  constructor() {
    this.store = undefined;
  }

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

      if (changes.has(Changes.restriction)) {
        dispatch(setRestrictionType(updatedState.restriction));
      }

      if (changes.has(Changes.compliance) && updatedState.compliance) {
        dispatch(setCompliance(updatedState.compliance));
      }

      if (changes.has(Changes.markets)) {
        dispatch(
          setAbacusHasMarkets(
            updatedState.marketIds() != null && updatedState.marketIds()!.size > 0
          )
        );
      }

      subaccountNumbers?.forEach((subaccountId: number) => {
        if (changes.has(Changes.subaccount)) {
          const subaccountData = updatedState.subaccount(subaccountId);
          const isChildSubaccount = subaccountId >= NUM_PARENT_SUBACCOUNTS;
          if (!isChildSubaccount) {
            dispatch(setSubaccountForPostOrders(subaccountData));
          }
        }
      });
    }
  }

  lastOrderChanged(order: SubaccountOrder) {
    this.store?.dispatch(setLatestOrder({ clientId: order.clientId, id: order.id }));
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
