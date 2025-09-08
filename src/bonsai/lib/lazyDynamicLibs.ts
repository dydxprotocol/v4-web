import { weakMapMemoize } from 'reselect';

// must lazy load separately to ensure best-possible tree shaking/static analysis
export const getLazyLocalWallet = weakMapMemoize(async () => {
  return (await import('starboard-client-js')).LocalWallet;
});

export const getLazyNobleWallet = weakMapMemoize(async () => {
  return (await import('starboard-client-js')).NobleClient;
});

export const getLazyStargateClient = weakMapMemoize(async () => {
  return (await import('@cosmjs/stargate')).StargateClient;
});
