import { IndexerWebsocket } from './indexerWebsocket';

type Unsubscribe = () => void;

export class WebsocketDerivedValue<T> {
  private unsubFromWs: Unsubscribe | undefined;

  constructor(
    websocket: IndexerWebsocket,
    // subscriptions must be unique, we are trusing whoever is constructing us is ensuring uniqueness
    sub: {
      channel: string;
      id: string | undefined;
      handleBaseData: (data: any, value: T) => T;
      handleUpdates: (updates: any[], value: T) => T;
    },
    private value: T,
    private changeHandler: ((val: T) => void) | undefined
  ) {
    this.unsubFromWs = websocket.addChannelSubscription({
      channel: sub.channel,
      id: sub.id,
      handleBaseData: (data) => this._setValue(sub.handleBaseData(data, this.value)),
      handleUpdates: (updates) => this._setValue(sub.handleUpdates(updates, this.value)),
    });
  }

  getValue(): T {
    return this.value;
  }

  teardown() {
    this.changeHandler = undefined;
    this.unsubFromWs?.();
    this.unsubFromWs = undefined;
  }

  private _setValue = (newValue: T): void => {
    if (newValue !== this.value) {
      this.value = newValue;
      this.changeHandler?.(this.value);
    }
  };
}
