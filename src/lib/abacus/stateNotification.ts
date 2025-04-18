// eslint-disable-next-line max-classes-per-file
import { kollections } from '@dydxprotocol/v4-abacus';

import type {
  AbacusNotification,
  AbacusStateNotificationProtocol,
  PerpetualState,
  PerpetualStateChanges,
} from '@/constants/abacus';
import { Changes } from '@/constants/abacus';

import { type RootStore } from '@/state/_store';
import { setInputs } from '@/state/inputs';
import { updateNotifications } from '@/state/notifications';

import { Nullable } from '@/lib/typeUtils';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  private store: RootStore | undefined;

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

    if (updatedState) {
      if (changes.has(Changes.input)) {
        dispatch(setInputs(updatedState.input));
      }
    }
  }

  lastOrderChanged() {}

  errorsEmitted() {}

  apiStateChanged() {}

  setStore = (store: RootStore) => {
    this.store = store;
  };
}

export default AbacusStateNotifier;
