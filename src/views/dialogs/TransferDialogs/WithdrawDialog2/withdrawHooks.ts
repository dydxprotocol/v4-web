import { useCallback, useMemo, useState } from 'react';

import { TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '@dydxprotocol/v4-client-js';
import { RouteResponse, UserAddress } from '@skip-go/client';
import BigNumber from 'bignumber.js';

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
import { Withdraw } from '@/state/transfers';

import { track } from '@/lib/analytics/analytics';
import { MustBigNumber } from '@/lib/numbers';

import { getUserAddressesForRoute, isInstantTransfer, parseWithdrawError } from '../utils';

export function useWithdrawStep({
  destinationAddress,
  withdrawRoute,
  onWithdraw,
  onWithdrawSigned,
}: {
  destinationAddress: string;
  withdrawRoute?: RouteResponse;
  onWithdraw: (withdraw: Withdraw) => void;
  onWithdrawSigned: () => void;
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
        onTransactionSigned: async () => {
          onWithdrawSigned();
        },
        onTransactionBroadcast: async ({ txHash, chainID }) => {
          const baseWithdraw = {
            type: 'withdraw' as const,
            txHash,
            chainId: chainID,
            destinationChainId: withdrawRoute.destAssetChainID,
            status: 'pending' as const,
            estimatedAmountUsd: withdrawRoute.usdAmountOut ?? '',
            isInstantWithdraw: isInstantTransfer(withdrawRoute),
            transferAssetRelease: null,
          };

          track(AnalyticsEvents.WithdrawSubmitted(baseWithdraw));
          onWithdraw(baseWithdraw);
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      track(AnalyticsEvents.WithdrawError({ error: error.message }));

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
