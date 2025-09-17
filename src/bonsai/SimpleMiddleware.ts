import { calc } from '@/lib/do';

import { OperationResult, wrapOperationFailure } from './lib/operationResult';

export type MiddlewareResult<TContext, TResult = any> = {
  result: OperationResult<TResult>;
  finalContext: TContext;
};

export type Middleware<TIn extends {}, TExtra extends {}, TResult = any> = (
  context: TIn,
  next: (context: TIn & TExtra) => Promise<MiddlewareResult<TIn & TExtra, TResult>>
) => Promise<MiddlewareResult<TIn, TResult>>;

type TopLevelMiddleware<LastContext extends {}, TContext extends LastContext, TResult = any> = (
  next: (ctx: TContext) => Promise<MiddlewareResult<TContext, TResult>>
) => Promise<MiddlewareResult<LastContext, TResult>>;

function getEngineMiddleware<TContext, TEngineResult>(
  engine: (context: TContext) => Promise<OperationResult<TEngineResult>>
) {
  return async (ctx: TContext): Promise<MiddlewareResult<TContext, TEngineResult>> => {
    const result = await calc(async () => {
      try {
        return await engine(ctx);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          'Middleware engine threw an errror. Middleware should never throw errors.',
          error
        );
        return wrapOperationFailure('Middleware engine returned improper error');
      }
    });
    return {
      result,
      finalContext: ctx,
    };
  };
}

function getStartMiddleware<TIn extends {}>(start: TIn): TopLevelMiddleware<{}, TIn> {
  return (next) => next({ ...start });
}

type TaskBuilder<TContext extends {}, TResult = any> = {
  with<TExtraContext extends {}>(
    nextMiddleware: Middleware<TContext, TExtraContext, TResult>
  ): TaskBuilder<TContext & TExtraContext, TResult>;

  do(
    engine: (context: TContext) => Promise<OperationResult<TResult>>
  ): Promise<OperationResult<TResult>>;
};

export function taskBuilder<StartContext extends {}, ResultType = any>(
  startContext: StartContext
): TaskBuilder<StartContext, ResultType> {
  return wrapperTaskBuilder(getStartMiddleware(startContext));
}

function wrapperTaskBuilder<TContext extends {}>(topMiddleware: TopLevelMiddleware<any, TContext>) {
  const thisBuilder: TaskBuilder<TContext> = {
    with: <TExtraContext extends {}>(nextMiddleware: Middleware<TContext, TExtraContext>) => {
      return wrapperTaskBuilder<TContext & TExtraContext>(
        (next): Promise<MiddlewareResult<TContext & TExtraContext>> => {
          return topMiddleware(async (withAllExtras) => {
            try {
              return await nextMiddleware(withAllExtras, next);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error(
                'Middleware engine threw an error. Middleware should never throw erors.',
                error
              );
              return createMiddlewareFailureResult(
                wrapOperationFailure('Middleware engine returned improper error'),
                withAllExtras
              );
            }
          });
        }
      );
    },
    do: async (engine) => {
      return (await topMiddleware(getEngineMiddleware(engine))).result;
    },
  };
  return thisBuilder;
}

export function createMiddleware<TExtra extends {}, MinimumContext extends {} = {}>(
  fn: <TIn extends MinimumContext>(
    context: TIn,
    next: (context: TIn & TExtra) => Promise<MiddlewareResult<TIn & TExtra>>
  ) => Promise<MiddlewareResult<TIn>>
) {
  return fn;
}

export function createMiddlewareFailureResult<TContext, TResult>(
  operationFailure: OperationResult<TResult>,
  context: TContext
): MiddlewareResult<TContext, TResult> {
  return {
    result: operationFailure,
    finalContext: context,
  };
}
