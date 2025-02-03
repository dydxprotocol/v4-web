import { useCallback, useMemo } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { RouteResponse, UserAddress } from '@skip-go/client';

import { CosmosChainId } from '@/constants/graz';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';

import { Withdraw } from '@/state/transfers';

import { getUserAddressesForRoute } from '../DepositDialog2/utils';

export function isInstantWithdraw(route: RouteResponse) {
  // @ts-ignore SDK doesn't know about .goFastTransfer
  return Boolean(route.operations.find((op) => op.goFastTransfer));
}

export function useWithdrawSteps({
  // withdrawToken,
  withdrawRoute,
  onWithdraw,
}: {
  // withdrawToken?: TokenForTransfer;
  withdrawRoute?: RouteResponse;
  onWithdraw: (withdraw: Withdraw) => void;
}) {
  const { skipClient } = useSkipClient();
  const { dydxAddress, localDydxWallet, localNobleWallet, nobleAddress, sourceAccount } =
    useAccounts();

  const userAddresses: UserAddress[] | undefined = useMemo(() => {
    if (
      dydxAddress == null ||
      withdrawRoute == null ||
      withdrawRoute.requiredChainAddresses.length === 0
    ) {
      return undefined;
    }

    return getUserAddressesForRoute(withdrawRoute, sourceAccount, nobleAddress, dydxAddress);
  }, [dydxAddress, nobleAddress, sourceAccount, withdrawRoute]);

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
            assetId: 0,
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
    } catch (error) {
      // eslint-disable-next-line prettier/prettier, no-console
      console.error(error);
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
  };
}
