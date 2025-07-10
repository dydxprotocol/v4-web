import { calc } from '@/lib/do';

import { OperationResult, wrapOperationFailure } from './lib/operationResult';

export type MiddlewareResult<TContext, TResult = any> = {
  result: OperationResult<TResult>;
  finalContext: TContext;
};

export type Middleware<TIn extends {}, TExtra extends {}> = (
  context: TIn,
  next: (context: TIn & TExtra) => Promise<MiddlewareResult<TIn & TExtra>>
) => Promise<MiddlewareResult<TIn>>;

function getEngineMiddleware<TContext, TEngineResult>(
  engine: (context: TContext) => Promise<OperationResult<TEngineResult>>
) {
  return async (ctx: TContext): Promise<MiddlewareResult<TContext, TEngineResult>> => {
    const result = await calc(async () => {
      try {
        return await engine(ctx);
      } catch (error) {
        return wrapOperationFailure('Middleware engine returned improper error');
      }
    });
    return {
      result,
      finalContext: ctx,
    };
  };
}

function getNoOpMiddleware<TIn extends {}>(): Middleware<TIn, {}> {
  return (context, next) => next({ ...context });
}

type TaskBuilder<StartContext extends {}, AllExtras extends {}, ResultType = any> = {
  with<TExtraContext extends {}>(
    middleware: Middleware<StartContext & AllExtras, AllExtras & TExtraContext>
  ): TaskBuilder<StartContext, AllExtras & TExtraContext, ResultType>;

  do(
    engine: (context: StartContext & AllExtras) => Promise<OperationResult<ResultType>>
  ): Promise<MiddlewareResult<StartContext, ResultType>>;
};

export function taskBuilder<StartContext extends {}>(
  startContext: StartContext
): TaskBuilder<StartContext, {}> {
  return wrapperTaskBuilder(startContext, getNoOpMiddleware<StartContext>());
}

function wrapperTaskBuilder<StartContext extends {}, AllExtras extends {}>(
  startContext: StartContext,
  middleware: Middleware<StartContext, AllExtras>
) {
  const thisBuilder: TaskBuilder<StartContext, AllExtras> = {
    with: (nextMiddleware) => {
      return wrapperTaskBuilder(startContext, (context, next) => {
        return middleware(context, (withAllExtras) => {
          return nextMiddleware(withAllExtras, next);
        });
      });
    },
    do: (engine) => {
      return middleware(startContext, getEngineMiddleware(engine));
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
