import { IndexerWebsocket } from './indexerWebsocket';

type Unsubscribe = () => void;

export class WebsocketDerivedValue<T> {
  private unsubFromWs: Unsubscribe | undefined;

  private value: T;

  private subscribers: ((val: T) => void)[] = [];

  constructor(
    websocket: IndexerWebsocket,
    // subscriptions must be unique, we are trusing whoever is constructing us is ensuring uniqueness
    sub: {
      channel: string;
      id: string | undefined;
      handleBaseData: (data: any, value: T, fullMessage: any) => T;
      handleUpdates: (updates: any[], value: T, fullMessage: any) => T;
    },
    value: T
  ) {
    this.value = value;

    this.unsubFromWs = websocket.addChannelSubscription({
      channel: sub.channel,
      id: sub.id,
      batched: true,
      handleBaseData: (data, fullMessage) =>
        this._setValue(sub.handleBaseData(data, this.value, fullMessage)),
      handleUpdates: (updates, fullMessage) =>
        this._setValue(sub.handleUpdates(updates, this.value, fullMessage)),
    });
  }

  getValue(): T {
    return this.value;
  }

  subscribe(handler: (val: T) => void): () => void {
    this.subscribers.push(handler);
    handler(this.value);

    return () => {
      this.subscribers = this.subscribers.filter((h) => h !== handler);
    };
  }

  teardown() {
    this.subscribers = [];
    this.unsubFromWs?.();
    this.unsubFromWs = undefined;
  }

  private _setValue = (newValue: T): void => {
    if (newValue !== this.value) {
      this.value = newValue;
      this.subscribers.forEach((subscriber) => subscriber(this.value));
    }
  };
}
