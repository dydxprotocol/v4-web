type Subscriber<T> = (value: T) => void;
type Unsubscribe = () => void;

export class SubscribableValue<T> {
  private value: T;

  private subscribers: Set<Subscriber<T>> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T): void {
    // todo shallow equal option
    if (newValue !== this.value) {
      this.value = newValue;
      this.subscribers.forEach((subscriber) => {
        subscriber(this.value);
      });
    }
  }

  addSubscriber(subscriber: Subscriber<T>): Unsubscribe {
    this.subscribers.add(subscriber);

    // Immediately notify new subscriber of current value
    subscriber(this.value);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  clearSubs() {
    this.subscribers = new Set();
  }
}
