import { useMemo } from 'react';

import { formatUnits } from 'viem';

import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DYDX_CHAIN_DYDX_DENOM, DYDX_DECIMALS, USDC_DECIMALS } from '@/constants/tokens';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { LinkOutIcon } from '@/icons';
import ExchangeIcon from '@/icons/exchange.svg';

import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
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
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const [inputToken, outputToken] = useMemo(() => {
    const inputTokenLabel = swap.route.sourceAssetDenom === DYDX_CHAIN_DYDX_DENOM ? 'dYdX' : 'USDC';
    const outputTokenLabel = inputTokenLabel === 'dYdX' ? 'USDC' : 'dYdX';
    return [inputTokenLabel, outputTokenLabel];
  }, [swap.route.sourceAssetDenom]);

  const icon = useMemo(() => {
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return <LoadingSpinner size="28" />;
      case 'success':
        return <ExchangeIcon />;
      case 'error':
        return <ExchangeIcon />;
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
        return <span tw="text-color-error">{stringGetter({ key: STRING_KEYS.SWAP_ERROR })}</span>;
      default:
        return null;
    }
  }, [stringGetter, swap.status]);

  const description = useMemo(() => {
    const inputAmount = Number(
      formatUnits(
        BigInt(swap.route.amountIn),
        swap.route.sourceAssetDenom === DYDX_CHAIN_DYDX_DENOM ? DYDX_DECIMALS : USDC_DECIMALS
      )
    );
    const inputLabel = `${inputAmount.toFixed(2)} ${inputToken}`;
    const outputLabel = `${outputToken}`;
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
              tw="flex h-fit items-center p-0 text-color-text-0 font-small-book hover:text-color-text-1"
              buttonStyle={ButtonStyle.WithoutBackground}
              onClick={() => {
                window.open(`${mintscanTxUrl.replace('{tx_hash}', swap.txHash ?? '')}`, '_blank');
              }}
            >
              <span>{stringGetter({ key: STRING_KEYS.VIEW_TRANSACTION })}</span>
              <LinkOutIcon />
            </Button>
          </div>
        );
      case 'error':
        return swap.txHash ? (
          <Button
            tw="flex h-fit items-center p-0 text-color-text-0 font-small-book hover:text-color-text-1"
            buttonStyle={ButtonStyle.WithoutBackground}
            onClick={() => {
              window.open(`${mintscanTxUrl.replace('{tx_hash}', swap.txHash ?? '')}`, '_blank');
            }}
          >
            <span>{stringGetter({ key: STRING_KEYS.VIEW_TRANSACTION })}</span>
            <LinkOutIcon />
          </Button>
        ) : null;
      default:
        return null;
    }
  }, [
    inputToken,
    mintscanTxUrl,
    outputToken,
    stringGetter,
    swap.route.amountIn,
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
