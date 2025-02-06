import { useCallback, useMemo, useState } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { RouteResponse, UserAddress } from '@skip-go/client';

import { CosmosChainId } from '@/constants/graz';
import { USDC_ASSET_ID } from '@/constants/tokens';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';

import { Withdraw } from '@/state/transfers';

import { getUserAddressesForRoute, isInstantTransfer, parseWithdrawError } from '../utils';

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
            isInstantWithdraw: isInstantTransfer(withdrawRoute),
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
