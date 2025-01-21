import { RouteResponse, UserAddress } from '@skip-go/client';

import { DYDX_DEPOSIT_CHAIN, isEvmDepositChainId } from '@/constants/chains';
import { CosmosChainId } from '@/constants/graz';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { WalletNetworkType } from '@/constants/wallets';

import { SourceAccount } from '@/state/wallet';

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

export function getUserAddressesForRoute(
  route: RouteResponse,
  sourceAccount: SourceAccount,
  nobleAddress?: string,
  dydxAddress?: string
): UserAddress[] {
  const chains = route.requiredChainAddresses;

  return chains.map((chainId) => {
    switch (chainId) {
      case CosmosChainId.Noble:
        if (!nobleAddress) throw new Error('nobleAddress undefined');
        return { chainID: chainId, address: nobleAddress };
      case CosmosChainId.Osmosis:
        // TODO(deposit2.0): handle osmosis case!
        return { chainID: chainId, address: 'osmo1c2jm54xlan3jjfdxeggv7rm3905sscxjr2gtn5' };
      case DYDX_DEPOSIT_CHAIN:
        if (!dydxAddress) throw new Error('dydxAddress undefined');
        return { chainID: chainId, address: dydxAddress };
      default:
        if (
          (isEvmDepositChainId(chainId) && sourceAccount.chain === WalletNetworkType.Evm) ||
          (chainId === SOLANA_MAINNET_ID && sourceAccount.chain === SOLANA_MAINNET_ID)
        ) {
          return { chainID: chainId, address: sourceAccount.address as string };
        }

        throw new Error(`unhandled chainId ${chainId} for user address ${sourceAccount.address}`);
    }
  });
}
