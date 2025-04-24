// eslint-disable-next-line max-classes-per-file
import { kollections } from '@dydxprotocol/v4-abacus';

import type { AbacusNotification, AbacusStateNotificationProtocol } from '@/constants/abacus';

import { type RootStore } from '@/state/_store';
import { updateNotifications } from '@/state/notifications';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  private store: RootStore | undefined;

  environmentsChanged(): void {}

  notificationsChanged(notifications: kollections.List<AbacusNotification>): void {
    this.store?.dispatch(updateNotifications(notifications.toArray()));
  }

  stateChanged() {}

  lastOrderChanged() {}

  errorsEmitted() {}

  apiStateChanged() {}

  setStore = (store: RootStore) => {
    this.store = store;
  };
}

export default AbacusStateNotifier;
