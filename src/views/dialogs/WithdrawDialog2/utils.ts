import { useCallback, useMemo, useState } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { RouteResponse, UserAddress } from '@skip-go/client';
import { PublicKey } from '@solana/web3.js';
import { isAddress } from 'viem';
import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from '@/constants/graz';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { USDC_ASSET_ID } from '@/constants/tokens';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';

import { Withdraw } from '@/state/transfers';

import { validateCosmosAddress } from '@/lib/addressUtils';

import { getUserAddressesForRoute } from '../DepositDialog2/utils';

export function isInstantWithdraw(route: RouteResponse) {
  // @ts-ignore SDK doesn't know about .goFastTransfer
  return Boolean(route.operations.find((op) => op.goFastTransfer));
}

const parseWithdrawError = (e: Error, fallbackMessage: string) => {
  if (e.message.includes('NewlyUndercollateralized')) {
    return 'Your withdrawal would leave your account undercollateralized. Please try a a smaller amount.';
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
    case SOLANA_MAINNET_ID: {
      try {
        // Generating a publickey will demonstrate if an address is valid
        // eslint-disable-next-line no-new
        new PublicKey(address);
        return true;
      } catch (_e) {
        return false;
      }
    }
    case mainnet.id.toString():
    case arbitrum.id.toString():
    case base.id.toString():
    case optimism.id.toString():
    case polygon.id.toString(): {
      return isAddress(address, { strict: true });
    }
    default: {
      return false;
    }
  }
}

export function useWithdrawStep({
  withdrawRoute,
  onWithdraw,
}: {
  withdrawRoute?: RouteResponse;
  onWithdraw: (withdraw: Withdraw) => void;
}) {
  const { skipClient } = useSkipClient();
  const {
    dydxAddress,
    localDydxWallet,
    localNobleWallet,
    nobleAddress,
    osmosisAddress,
    neutronAddress,
    sourceAccount,
  } = useAccounts();
  const [isLoading, setIsLoading] = useState(false);

  const userAddresses: UserAddress[] | undefined = useMemo(() => {
    if (
      dydxAddress == null ||
      withdrawRoute == null ||
      withdrawRoute.requiredChainAddresses.length === 0
    ) {
      return undefined;
    }

    return getUserAddressesForRoute(
      withdrawRoute,
      sourceAccount,
      nobleAddress,
      dydxAddress,
      osmosisAddress,
      neutronAddress
    );
  }, [dydxAddress, neutronAddress, nobleAddress, osmosisAddress, sourceAccount, withdrawRoute]);

  const getCosmosSigner = useCallback(
    async (chainID: string) => {
      if (chainID === CosmosChainId.Noble) {
        if (!localNobleWallet?.offlineSigner) {
          throw new Error('No local noblewallet offline signer. Cannot submit tx');
        }
        return localNobleWallet.offlineSigner;
      }

      if (!localDydxWallet?.offlineSigner)
        throw new Error('No local dydxwallet offline signer. Cannot submit tx');

      return localDydxWallet.offlineSigner;
    },
    [localDydxWallet, localNobleWallet]
  );

  const executeWithdraw = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!withdrawRoute) throw new Error('No route found');
      if (!userAddresses) throw new Error('No user addresses found');
      if (!localDydxWallet && !localNobleWallet) throw new Error('No local wallets found');

      await skipClient.executeRoute({
        getCosmosSigner,
        route: withdrawRoute,
        userAddresses,
        beforeMsg: {
          msg: JSON.stringify({
            sender: {
              owner: dydxAddress,
              number: 0,
            },
            recipient: dydxAddress,
            assetId: USDC_ASSET_ID,
            quantums: withdrawRoute.amountIn,
          }),
          msgTypeURL: TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
        },
        onTransactionBroadcast: async ({ txHash, chainID }) => {
          onWithdraw({
            type: 'withdraw',
            txHash,
            chainId: chainID,
            status: 'pending',
            estimatedAmountUsd: withdrawRoute.usdAmountOut ?? '',
            isInstantWithdraw: isInstantWithdraw(withdrawRoute),
          });
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: parseWithdrawError(error, 'Your withdrawal has failed. Please try again.'),
      };
    } finally {
      setIsLoading(false);
    }
  }, [
    dydxAddress,
    withdrawRoute,
    skipClient,
    userAddresses,
    onWithdraw,
    getCosmosSigner,
    localDydxWallet,
    localNobleWallet,
  ]);

  return {
    executeWithdraw,
    isLoading,
  };
}
