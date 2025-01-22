// Because our deposit flow only supports ETH and USDC
export function getTokenSymbol(denom: string) {
  if (denom === 'polygon-native') {
    return 'POL';
  }

  if (isNativeTokenDenom(denom)) return 'ETH';

  return 'USDC';
}

export function isNativeTokenDenom(denom: string) {
  return denom.endsWith('native');
}
