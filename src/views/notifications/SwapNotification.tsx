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

  const icon = useMemo(() => {
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return <LoadingDots />;
      case 'success':
        return <ExchangeIcon />;
      case 'error':
        return <ErrorExclamationIcon />;
      default:
        return null;
    }
  }, [swap.status]);

  const title = useMemo(() => {
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return <span>{stringGetter({ key: STRING_KEYS.SWAP_PENDING })}</span>;
      case 'success':
        return (
          <span tw="text-color-success">{stringGetter({ key: STRING_KEYS.SWAP_SUCCESS })}</span>
        );
      case 'error':
        return <span>{stringGetter({ key: STRING_KEYS.SWAP_ERROR })}</span>;
      default:
        return null;
    }
  }, [stringGetter, swap.status]);

  const description = useMemo(() => {
    const inputAmount = Number(
      formatUnits(
        BigInt(swap.route.amountIn),
        swap.route.sourceAssetDenom === 'adydx' ? DYDX_DECIMALS : USDC_DECIMALS
      )
    );
    const outputAmount = Number(
      formatUnits(
        BigInt(swap.route.amountOut),
        swap.route.sourceAssetDenom === 'adydx' ? USDC_DECIMALS : DYDX_DECIMALS
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
              params: { INPUT_LABEL: inputLabel, OUTPUT_LABEL: outputLabel },
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
              href={`https://www.mintscan.io/dydx/tx/${swap.txHash}`}
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
    swap.route.sourceAssetDenom,
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
