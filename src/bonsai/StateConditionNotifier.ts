import { timeUnits } from '@/constants/time';

import { RootState, RootStore } from '@/state/_store';
import { getUserWalletAddress } from '@/state/accountInfoSelectors';

type SelectorFn<Selected> = (state: RootState) => Selected;
type ValidationFn<Selected, Result> = (selected: Selected) => Result | null | undefined;
type NotificationCallback<Result> = (result: Result | null) => void;

export interface Tracker<Selected, Result> {
  selector: SelectorFn<Selected>;
  validator: ValidationFn<NoInfer<Selected>, Result>;
  onTrigger?: (success: boolean) => void;
}

interface TrackedCondition<Selected, Result> {
  selector: SelectorFn<Selected>;
  validator: ValidationFn<NoInfer<Selected>, Result>;
  callback: NotificationCallback<NoInfer<Result>>;
  lastValue: Selected | null;
  timeoutId: NodeJS.Timeout | undefined;
}

export class StateConditionNotifier {
  private store: RootStore;

  private trackedConditions: Array<TrackedCondition<any, any>> = [];

  private unsubscribeStore: (() => void) | null = null;

  private currentDydxAddress: string | undefined;

  constructor(store: RootStore) {
    this.store = store;
    this.currentDydxAddress = getUserWalletAddress(store.getState());
    this.setupStoreSubscription();
  }

  private setupStoreSubscription(): void {
    this.unsubscribeStore = this.store.subscribe(() => {
      const state = this.store.getState();

      // if address changes, clear all listeners
      const dydxAddress = getUserWalletAddress(state);
      if (dydxAddress !== this.currentDydxAddress) {
        this.currentDydxAddress = dydxAddress;
        this.clearAllConditions();
      }

      this.trackedConditions.forEach((condition) => {
        const currentValue = condition.selector(state);

        if (condition.lastValue === currentValue) {
          return;
        }

        condition.lastValue = currentValue;

        const validationResult = condition.validator(currentValue);
        if (validationResult != null) {
          clearTimeout(condition.timeoutId);
          this.trackedConditions = this.trackedConditions.filter((t) => t !== condition);
          condition.callback(validationResult);
        }
      });
    });
  }

  // if user address changes, callback is never called
  public notifyWhenTrue<Selected, Result>(
    selector: SelectorFn<Selected>,
    validator: ValidationFn<NoInfer<Selected>, Result>,
    callback: NotificationCallback<NoInfer<Result>>,
    timeoutMs: number = timeUnits.second * 30
  ): () => void {
    const state = this.store.getState();
    const initialValue = selector(state);

    // Check if already true
    const validationResult = validator(initialValue);
    if (validationResult != null) {
      callback(validationResult);
      return () => null;
    }

    const condition: TrackedCondition<any, any> = {
      selector,
      validator,
      callback,
      lastValue: initialValue,
      timeoutId: undefined,
    };
    // Set up timeout
    condition.timeoutId = setTimeout(() => {
      this.trackedConditions = this.trackedConditions.filter((t) => t !== condition);
      callback(null);
    }, timeoutMs);

    this.trackedConditions.push(condition);
    return () => {
      clearTimeout(condition.timeoutId);
      this.trackedConditions = this.trackedConditions.filter((t) => t !== condition);
    };
  }

  private clearAllConditions(): void {
    // Clear all timeouts
    this.trackedConditions.forEach((condition) => {
      if (condition.timeoutId) {
        clearTimeout(condition.timeoutId);
      }
    });

    // Clear the map
    this.trackedConditions = [];
  }

  public tearDown(): void {
    this.clearAllConditions();

    // Unsubscribe from store
    this.unsubscribeStore?.();
    this.unsubscribeStore = null;
  }
}
