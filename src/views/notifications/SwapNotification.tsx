import { useMemo } from 'react';

import { formatUnits } from 'viem';

import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DYDX_DECIMALS, USDC_DECIMALS } from '@/constants/tokens';

import { useStringGetter } from '@/hooks/useStringGetter';

import { ErrorExclamationIcon } from '@/icons';
import ExchangeIcon from '@/icons/exchange.svg';

import { Button } from '@/components/Button';
import { LoadingDots } from '@/components/Loading/LoadingDots';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

import type { Swap } from '@/state/swaps';

type SwapNotificationProps = {
  swap: Swap;
};

export const SwapNotification = ({
  swap,
  notification,
  isToast,
}: SwapNotificationProps & NotificationProps) => {
  const stringGetter = useStringGetter();

  const [inputToken, outputToken] = useMemo(() => {
    const inputTokenLabel = swap.route.sourceAssetDenom === 'adydx' ? 'dYdX' : 'USDC';
    const outputTokenLabel = inputTokenLabel === 'dYdX' ? 'USDC' : 'dYdX';
    return [inputTokenLabel, outputTokenLabel];
  }, [swap.route.sourceAssetDenom]);

  const [icon, title] = useMemo(() => {
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return [
          <LoadingDots key="loading-icon" />,
          stringGetter({ key: STRING_KEYS.SWAP_PENDING }),
        ];
      case 'success':
        return [
          <ExchangeIcon key="success-icon" />,
          stringGetter({ key: STRING_KEYS.SWAP_SUCCESS }),
        ];
      case 'error':
        return [
          <ErrorExclamationIcon key="error-icon" />,
          stringGetter({ key: STRING_KEYS.SWAP_ERROR }),
        ];
      default:
        return [<ExchangeIcon key="loading-icon" />, ''];
    }
  }, [swap.status, stringGetter]);

  const description = useMemo(() => {
    const inputAmount = Number(
      formatUnits(
        BigInt(swap.route.amountIn),
        inputToken === 'usdc' ? USDC_DECIMALS : DYDX_DECIMALS
      )
    );
    const outputAmount = Number(
      formatUnits(
        BigInt(swap.route.amountOut),
        inputToken === 'dydx' ? USDC_DECIMALS : DYDX_DECIMALS
      )
    );
    const inputLabel = `${inputAmount.toFixed(2)} ${inputToken}`;
    const outputLabel = `${outputAmount.toFixed(2)} ${outputToken}`;
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return (
          <span>
            {stringGetter({
              key: STRING_KEYS.SWAP_PENDING_DESCRIPTION,
              params: { INPUT_TOKEN: inputLabel, OUTPUT_TOKEN: outputLabel },
            })}
          </span>
        );
      case 'success':
        return (
          <div tw="flex flex-wrap">
            <span>
              {stringGetter({
                key: STRING_KEYS.SWAP_SUCCESS_DESCRIPTION,
                params: { INPUT_LABEL: inputLabel, OUTPUT_LABEL: outputLabel },
              })}
            </span>
            <Button
              tw="h-fit p-0 text-color-accent font-small-book"
              buttonStyle={ButtonStyle.WithoutBackground}
              onClick={() => window.open(`https://www.mintscan.io/dydx/tx/${swap.txHash}`)}
            >
              {stringGetter({ key: STRING_KEYS.VIEW_TRANSACTION })}
            </Button>
          </div>
        );
      default:
        return null;
    }
  }, [
    inputToken,
    outputToken,
    stringGetter,
    swap.route.amountIn,
    swap.route.amountOut,
    swap.status,
    swap.txHash,
  ]);

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={icon}
      slotTitle={title}
      slotCustomContent={description}
    />
  );
};
