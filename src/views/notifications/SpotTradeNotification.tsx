import { useMemo } from 'react';

import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

import type { SpotTrade } from '@/state/spotTrades';

type SpotTradeNotificationProps = {
  trade: SpotTrade;
};

export const SpotTradeNotification = ({
  trade,
  notification,
  isToast,
}: SpotTradeNotificationProps & NotificationProps) => {
  const stringGetter = useStringGetter();

  const icon = useMemo(() => {
    if (trade.status === 'success') {
      return <Icon iconName={IconName.CheckCircle} tw="text-color-success" />;
    }
    return <Icon iconName={IconName.Warning} tw="text-color-error" />;
  }, [trade.status]);

  const title = useMemo(() => {
    if (trade.status === 'success') {
      return <span tw="text-color-success">Trade Successful</span>;
    }
    return <span tw="text-color-error">Transaction Failed</span>;
  }, [trade.status]);

  const description = useMemo(() => {
    if (trade.status === 'error') {
      return <span>Transaction failed. Please try again.</span>;
    }

    const isBuy = trade.side === 'buy';
    const body = `${isBuy ? 'Purchased' : 'Sold'} ${trade.tokenAmount} ${trade.tokenSymbol} for ${trade.solAmount} SOL`;

    return (
      <div tw="flex flex-wrap">
        <span>{body}</span>
        {trade.txHash && (
          <Button
            tw="flex h-fit items-center p-0 text-color-text-0 font-small-book hover:text-color-text-1"
            buttonStyle={ButtonStyle.WithoutBackground}
            onClick={() => {
              window.open(`https://solscan.io/tx/${trade.txHash}`, '_blank');
            }}
          >
            <span>{stringGetter({ key: STRING_KEYS.VIEW_TRANSACTION })}</span>
            <LinkOutIcon />
          </Button>
        )}
      </div>
    );
  }, [trade, stringGetter]);

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
