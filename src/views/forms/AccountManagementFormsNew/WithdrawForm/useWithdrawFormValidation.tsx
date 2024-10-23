import { useMemo } from 'react';

import { exchange } from '@dydxprotocol/v4-abacus';
import { Asset } from '@skip-go/client';
import BigNumber from 'bignumber.js';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';
import {
  MAX_CCTP_TRANSFER_AMOUNT,
  MIN_CCTP_TRANSFER_AMOUNT,
  TOKEN_DECIMALS,
} from '@/constants/numbers';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useRestrictions } from '@/hooks/useRestrictions';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useWithdrawalInfo } from '@/hooks/useWithdrawalInfo';

import { formatNumberOutput, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber } from '@/lib/numbers';

type UseValidationProps = {
  isCctp: boolean;
  debouncedAmountBN: BigNumber;
  freeCollateralBN: BigNumber;
  isValidDestinationAddress: boolean;
  onSubmitErrorMessage?: string;
  toAddress?: string;
  toChainId?: string;
  toToken?: Asset;
};

export const useWithdrawFormValidation = ({
  onSubmitErrorMessage,
  isCctp,
  debouncedAmountBN,
  toAddress,
  isValidDestinationAddress,
  toChainId,
  toToken,
  freeCollateralBN,
}: UseValidationProps): {
  alertType?: AlertType | undefined;
  errorMessage: string | undefined;
} => {
  const stringGetter = useStringGetter();
  const { sanctionedAddresses } = useRestrictions();
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { usdcLabel } = useTokenConfigs();
  const { usdcWithdrawalCapacity } = useWithdrawalInfo({ transferType: 'withdrawal' });

  return useMemo(() => {
    if (isCctp) {
      if (debouncedAmountBN.gte(MAX_CCTP_TRANSFER_AMOUNT)) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.MAX_CCTP_TRANSFER_LIMIT_EXCEEDED,
            params: {
              MAX_CCTP_TRANSFER_AMOUNT,
            },
          }),
        };
      }
      if (
        !debouncedAmountBN.isZero() &&
        MustBigNumber(debouncedAmountBN).lte(MIN_CCTP_TRANSFER_AMOUNT)
      ) {
        return {
          errorMessage: stringGetter({
            key: STRING_KEYS.AMOUNT_MINIMUM_ERROR,
            params: {
              NUMBER: MIN_CCTP_TRANSFER_AMOUNT,
              TOKEN: usdcLabel,
            },
          }),
        };
      }
    }
    if (onSubmitErrorMessage) {
      return {
        errorMessage: onSubmitErrorMessage,
      };
    }

    if (!toAddress) {
      return {
        alertType: AlertType.Warning,
        errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ADDRESS }),
      };
    }

    if (sanctionedAddresses.has(toAddress))
      return {
        errorMessage: stringGetter({
          key: STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
        }),
      };

    if (!isValidDestinationAddress) {
      return {
        errorMessage: stringGetter({
          key: STRING_KEYS.ENTER_VALID_ADDRESS,
        }),
      };
    }

    // TODO: https://linear.app/dydx/issue/OTE-874/handle-skip-request-error-responses
    // skip Client does not return error codes. work with skip on this
    // if (route?.code) {
    //   const routeErrorMessageOverride = getRouteErrorMessageOverride(route?.code, route?.message);
    //   const routeErrorContext = {
    //     transferType: TransferType.Withdraw,
    //     errorMessage: routeErrorMessageOverride ?? undefined,
    //     amount: debouncedAmount,
    //     chainId: toChainId ?? undefined,
    //     assetAddress: toToken?.denom ?? undefined,
    //     assetSymbol: toToken?.symbol ?? undefined,
    //     assetName: toToken?.name ?? undefined,
    //     assetId: toToken?.toString() ?? undefined,
    //   };
    //   track(AnalyticsEvents.RouteError(routeErrorContext));
    //   dd.info('Route error received', routeErrorContext);
    //   return {
    //     errorMessage: routeErrorMessageOverride
    //       ? stringGetter({
    //           key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
    //           params: { ERROR_MESSAGE: routeErrorMessageOverride },
    //         })
    //       : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }),
    //   };
    // }

    // TODO [onboarding-rewrite]: implement coinbase withdrawals
    if (!toChainId && !exchange) {
      return {
        errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_CHAIN }),
      };
    }
    if (!toToken) {
      return {
        errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MUST_SPECIFY_ASSET }),
      };
    }

    if (debouncedAmountBN.gt(MustBigNumber(freeCollateralBN))) {
      return {
        errorMessage: stringGetter({ key: STRING_KEYS.WITHDRAW_MORE_THAN_FREE }),
      };
    }

    // Withdrawal Safety
    if (usdcWithdrawalCapacity.gt(0) && debouncedAmountBN.gt(usdcWithdrawalCapacity)) {
      return {
        alertType: AlertType.Warning,
        errorMessage: stringGetter({
          key: STRING_KEYS.WITHDRAWAL_LIMIT_OVER,
          params: {
            USDC_LIMIT: (
              <span>
                {formatNumberOutput(usdcWithdrawalCapacity, OutputType.Number, {
                  decimalSeparator,
                  groupSeparator,
                  selectedLocale,
                  fractionDigits: TOKEN_DECIMALS,
                })}
                <Tag tw="ml-[0.5ch]">{usdcLabel}</Tag>
              </span>
            ),
          },
        }),
      };
    }
    return {
      errorMessage: undefined,
    };
  }, [
    isCctp,
    onSubmitErrorMessage,
    toAddress,
    sanctionedAddresses,
    stringGetter,
    isValidDestinationAddress,
    debouncedAmountBN,
    freeCollateralBN,
    usdcWithdrawalCapacity,
    usdcLabel,
    toChainId,
    toToken,
    decimalSeparator,
    groupSeparator,
    selectedLocale,
  ]);
};
