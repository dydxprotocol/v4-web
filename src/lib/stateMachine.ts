/**
 * @fileoverview Generic state machine implementation
 * A lightweight, type-safe state machine for managing complex state transitions
 */

export type StateConfig<TState extends string, TEvent extends { type: string }, TContext> = {
  [K in TState]: {
    on?: {
      [E in TEvent['type']]?: {
        target: TState;
        guard?: (context: TContext, event: Extract<TEvent, { type: E }>) => boolean;
        actions?: Array<(context: TContext, event: Extract<TEvent, { type: E }>) => void | Promise<void>>;
      };
    };
    entry?: Array<(context: TContext) => void | Promise<void>>;
    exit?: Array<(context: TContext) => void | Promise<void>>;
  };
};

export interface StateMachine<TState extends string, TEvent extends { type: string }, TContext> {
  state: TState;
  context: TContext;
  send: (event: TEvent) => Promise<void>;
  getState: () => TState;
  getContext: () => TContext;
  matches: (state: TState) => boolean;
  can: (eventType: TEvent['type']) => boolean;
}

export interface StateMachineConfig<TState extends string, TEvent extends { type: string }, TContext> {
  id: string;
  initial: TState;
  context: TContext;
  states: StateConfig<TState, TEvent, TContext>;
  onTransition?: (from: TState, to: TState, event: TEvent) => void;
  onError?: (error: Error, state: TState, event: TEvent) => void;
}

/**
 * Creates a state machine instance
 */
export function createStateMachine<
  TState extends string,
  TEvent extends { type: string },
  TContext
>(
  config: StateMachineConfig<TState, TEvent, TContext>
): StateMachine<TState, TEvent, TContext> {
  let currentState: TState = config.initial;
  let currentContext: TContext = config.context;
  let isTransitioning = false;

  const getStateConfig = (state: TState) => config.states[state];

  const send = async (event: TEvent): Promise<void> => {
    if (isTransitioning) {
      console.warn(`[${config.id}] Transition already in progress, queuing event:`, event.type);
      // In a production implementation, you might want to queue events
      return;
    }

    const stateConfig = getStateConfig(currentState);
    const transition = stateConfig.on?.[event.type];

    if (!transition) {
      console.warn(
        `[${config.id}] No transition defined for event "${event.type}" in state "${currentState}"`
      );
      return;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(currentContext, event as any)) {
      console.info(
        `[${config.id}] Guard prevented transition from "${currentState}" via "${event.type}"`
      );
      return;
    }

    const targetState = transition.target;
    const previousState = currentState;

    try {
      isTransitioning = true;

      // Execute exit actions for current state
      if (stateConfig.exit) {
        for (const exitAction of stateConfig.exit) {
          await exitAction(currentContext);
        }
      }

      // Execute transition actions
      if (transition.actions) {
        for (const action of transition.actions) {
          await action(currentContext, event as any);
        }
      }

      // Update state
      currentState = targetState;

      // Execute entry actions for new state
      const newStateConfig = getStateConfig(targetState);
      if (newStateConfig.entry) {
        for (const entryAction of newStateConfig.entry) {
          await entryAction(currentContext);
        }
      }

      // Notify transition
      config.onTransition?.(previousState, targetState, event);

      console.info(
        `[${config.id}] Transitioned: ${previousState} -> ${targetState} (via ${event.type})`
      );
    } catch (error) {
      console.error(
        `[${config.id}] Error during transition from "${previousState}" to "${targetState}":`,
        error
      );
      config.onError?.(error as Error, currentState, event);
      throw error;
    } finally {
      isTransitioning = false;
    }
  };

  const getState = () => currentState;

  const getContext = () => currentContext;

  const matches = (state: TState) => currentState === state;

  const can = (eventType: TEvent['type']) => {
    const stateConfig = getStateConfig(currentState);
    return !!stateConfig.on?.[eventType];
  };

  return {
    get state() {
      return currentState;
    },
    get context() {
      return currentContext;
    },
    send,
    getState,
    getContext,
    matches,
    can,
  };
}
