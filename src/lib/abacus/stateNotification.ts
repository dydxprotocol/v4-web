// eslint-disable-next-line max-classes-per-file
import type { AbacusStateNotificationProtocol } from '@/constants/abacus';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  environmentsChanged(): void {}

  notificationsChanged(): void {}

  stateChanged() {}

  lastOrderChanged() {}

  errorsEmitted() {}

  apiStateChanged() {}

  setStore = () => {};
}

export default AbacusStateNotifier;
