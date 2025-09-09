import { RouteResponse, UserAddress } from '@skip-go/client';
import { ChainMismatchError, isAddress, UserRejectedRequestError } from 'viem';
import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

import { DYDX_DEPOSIT_CHAIN, isEvmDepositChainId } from '@/constants/chains';
import { CosmosChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { WalletNetworkType } from '@/constants/wallets';

import { SourceAccount } from '@/state/wallet';

import { validateCosmosAddress } from '@/lib/addressUtils';

// Because our deposit flow only supports ETH and USDC

export function getTokenSymbol(denom: string) {
  if (denom === 'polygon-native') {
    return 'POL';
  }

  if (denom === 'avalanche-native') {
    return 'AVAX';
  }

  if (isNativeTokenDenom(denom)) return 'ETH';

  return 'USDC';
}

export function isNativeTokenDenom(denom: string) {
  return denom.endsWith('native');
}

export function isInstantTransfer(route: RouteResponse) {
  // @ts-ignore SDK doesn't know about .goFastTransfer
  return Boolean(route.operations.find((op) => op.goFastTransfer));
}

export function getUserAddressesForRoute(
  route: RouteResponse,
  sourceAccount: SourceAccount,
  nobleAddress?: string,
  dydxAddress?: string,
  osmosisAddress?: string,
  neutronAddress?: string,
  destinationAddress?: string // Withdraw Only: The final stop for the transfer
): UserAddress[] {
  const chains = route.requiredChainAddresses;
  const destinationChain = route.destAssetChainId;

  return chains.map((chainId, idx) => {
    // Withdraw Only: The last chain in the route and the destination address is valid
    if (chainId === destinationChain && idx === chains.length - 1 && destinationAddress) {
      return { chainId, address: destinationAddress };
    }

    switch (chainId) {
      case CosmosChainId.Noble:
        if (!nobleAddress) throw new Error('nobleAddress undefined');
        return { chainId, address: nobleAddress };
      case CosmosChainId.Osmosis:
        if (!osmosisAddress) throw new Error('osmosisAddress undefined');
        return { chainId, address: osmosisAddress };
      case CosmosChainId.Neutron:
        if (!neutronAddress) throw new Error('neutronAddress undefined');
        return { chainId, address: neutronAddress };
      case DYDX_DEPOSIT_CHAIN:
        if (!dydxAddress) throw new Error('dydxAddress undefined');
        return { chainId, address: dydxAddress };
      default:
        if (isEvmDepositChainId(chainId) && sourceAccount.chain === WalletNetworkType.Evm) {
          return { chainId, address: sourceAccount.address as string };
        }

        throw new Error(`unhandled chainId ${chainId} for user address ${sourceAccount.address}`);
    }
  });
}

// Copied from Skip https://github.com/skip-mev/skip-go/blob/147937416c81a69a447f4825b8c86806c5688194/packages/client/src/client.ts#L319
export function userAddressHelper(route: RouteResponse, userAddresses: UserAddress[]) {
  let addressList: string[] = [];
  let i = 0;
  for (let j = 0; j < userAddresses.length; j += 1) {
    if (route.requiredChainAddresses[i] !== userAddresses[j]?.chainId) {
      i = j;
      continue;
    }
    addressList.push(userAddresses[j]!.address!);
    i += 1;
  }

  if (addressList.length !== route.requiredChainAddresses.length) {
    addressList = userAddresses.map((x) => x.address);
  }
  return addressList;
}

export function parseError(e: Error, fallbackMessage: string) {
  if ('code' in e && e.code === UserRejectedRequestError.code) {
    return STRING_KEYS.USER_REJECTED;
  }

  if ('name' in e && e.name === ChainMismatchError.name) {
    return STRING_KEYS.CHAIN_MISMATCH;
  }

  if ('message' in e && e.message.includes('Insufficient balance for gas')) {
    return STRING_KEYS.INSUFFICIENT_GAS_BALANCE;
  }

  return fallbackMessage;
}

export const parseWithdrawError = (e: Error, fallbackMessage: string) => {
  if (e.message.includes('NewlyUndercollateralized')) {
    return STRING_KEYS.WITHDRAWAL_UNDERCOLLATERALIZED;
  }

  return fallbackMessage;
};

export function isValidWithdrawalAddress(address: string, chainId: string): boolean {
  switch (chainId) {
    case CosmosChainId.Noble:
      return validateCosmosAddress(address, 'noble');
    case CosmosChainId.Osmosis:
      return validateCosmosAddress(address, 'osmo');
    case CosmosChainId.Neutron:
      return validateCosmosAddress(address, 'neutron');
    case mainnet.id.toString():
    case arbitrum.id.toString():
    case base.id.toString():
    case optimism.id.toString():
    case polygon.id.toString():
    case avalanche.id.toString(): {
      return isAddress(address, { strict: true });
    }
    default: {
      return false;
    }
  }
}
