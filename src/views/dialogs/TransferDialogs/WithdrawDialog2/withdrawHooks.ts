import { useCallback, useMemo, useState } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { RouteResponse, UserAddress } from '@skip-go/client';
import BigNumber from 'bignumber.js';
import { initial } from 'lodash';

import { AnalyticsEvents } from '@/constants/analytics';
import { CosmosChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { USDC_ASSET_ID } from '@/constants/tokens';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useWithdrawalInfo } from '@/hooks/useWithdrawalInfo';

import { formatNumberOutput, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { Withdraw, WithdrawSubtransaction } from '@/state/transfers';

import { track } from '@/lib/analytics/analytics';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { DYDX_DEPOSIT_CHAIN } from '../consts';
import { getUserAddressesForRoute, isInstantTransfer, parseWithdrawError } from '../utils';

export function useWithdrawStep({
  destinationAddress,
  withdrawRoute,
  onWithdraw,
  onWithdrawBroadcastUpdate,
  onWithdrawSigned,
}: {
  destinationAddress: string;
  withdrawRoute?: RouteResponse;
  onWithdraw: (withdraw: Withdraw) => void;
  onWithdrawBroadcastUpdate: (withdrawId: string, subtransaction: WithdrawSubtransaction) => void;
  onWithdrawSigned: (withdrawId: string) => void;
}) {
  const stringGetter = useStringGetter();
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
      neutronAddress,
      destinationAddress
    );
  }, [
    dydxAddress,
    neutronAddress,
    nobleAddress,
    osmosisAddress,
    sourceAccount,
    withdrawRoute,
    destinationAddress,
  ]);

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

  const executeWithdraw = async () => {
    try {
      setIsLoading(true);
      if (!withdrawRoute) throw new Error('No route found');
      if (!userAddresses) throw new Error('No user addresses found');
      if (!localDydxWallet || !localNobleWallet || !dydxAddress) {
        throw new Error('No local wallets found');
      }

      const withdrawId = `withdraw-${crypto.randomUUID()}`;

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
        onTransactionSigned: async () => {
          onWithdrawSigned(withdrawId);
        },
        onTransactionBroadcast: async ({ txHash, chainID }) => {
          // First Broadcast will always originate from v4 chain
          if (chainID === DYDX_DEPOSIT_CHAIN) {
            // Create subtransactions for each chain in the withdrawRoute excluding the last chain. Only the v4 chain will have a txHash at this point
            const subtransactions: WithdrawSubtransaction[] = initial(
              withdrawRoute.requiredChainAddresses
            ).map((chainId) => ({
              chainId,
              txHash: chainId === chainID ? txHash : undefined,
              status: chainId === chainID ? ('pending' as const) : ('idle' as const),
            }));

            const baseWithdraw: Withdraw = {
              id: withdrawId,
              transactions: subtransactions,
              type: 'withdraw' as const,
              status: 'pending' as const,
              destinationChainId: withdrawRoute.destAssetChainID,
              estimatedAmountUsd: withdrawRoute.usdAmountOut ?? '',
              isInstantWithdraw: isInstantTransfer(withdrawRoute),
              transferAssetRelease: null,
            };

            track(AnalyticsEvents.WithdrawSubmitted(baseWithdraw));
            onWithdraw(baseWithdraw);
          } else {
            // Update the subtransaction with the txHash
            const subtransaction: WithdrawSubtransaction = {
              chainId: chainID,
              txHash,
              status: 'pending' as const,
            };

            onWithdrawBroadcastUpdate(withdrawId, subtransaction);
          }
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      track(AnalyticsEvents.WithdrawError({ error: error.message }));
      log('withdrawHooks/executeWithdraw', error);

      return {
        success: false,
        errorMessage: stringGetter({
          key: parseWithdrawError(error, STRING_KEYS.WITHDRAWAL_FAILED_TRY_AGAIN),
        }),
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeWithdraw,
    isLoading,
  };
}

export function useProtocolWithdrawalValidation({
  freeCollateral,
  withdrawAmount,
  selectedRoute,
}: {
  freeCollateral?: BigNumber;
  withdrawAmount: string;
  selectedRoute?: RouteResponse;
}): string | undefined {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const { usdcWithdrawalCapacity } = useWithdrawalInfo({ transferType: 'withdrawal' });
  const withdrawAmountBN = MustBigNumber(withdrawAmount);

  if (withdrawAmount === '' || withdrawAmountBN.lte(0) || !selectedRoute) {
    return undefined;
  }

  if (freeCollateral && withdrawAmountBN.gt(freeCollateral)) {
    return stringGetter({ key: STRING_KEYS.WITHDRAW_MORE_THAN_FREE });
  }

  // WithdrawalGating
  if (usdcWithdrawalCapacity.gt(0) && withdrawAmountBN.gt(usdcWithdrawalCapacity)) {
    return stringGetter({
      key: STRING_KEYS.WITHDRAWAL_LIMIT_OVER,
      params: {
        USDC_LIMIT: formatNumberOutput(usdcWithdrawalCapacity, OutputType.Number, {
          decimalSeparator,
          groupSeparator,
          selectedLocale,
          fractionDigits: TOKEN_DECIMALS,
        }),
      },
    });
  }

  return undefined;
}
