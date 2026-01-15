import { type Context, use } from 'react';

export function useRequiredContext<T>(context: Context<T | null>): T {
  const contextValue = use(context);
  if (!contextValue) {
    throw new Error(
      `(${context.displayName ?? 'Unnamed context'}) Context value is null. Make sure the component is wrapped in the provider.`
    );
  }

  return contextValue;
}
