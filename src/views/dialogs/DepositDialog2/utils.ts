// Because our deposit flow only supports ETH and USDC
export function getTokenSymbol(denom: string) {
  if (denom === 'polygon-native') {
    return 'POL';
  }

  if (denom.endsWith('native')) return 'ETH';

  return 'USDC';
}
