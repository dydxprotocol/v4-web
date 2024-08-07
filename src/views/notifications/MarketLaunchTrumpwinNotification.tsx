import { Link } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { PREDICTION_MARKET } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

export const MarketLaunchTrumpwinNotification = ({ isToast, notification }: NotificationProps) => {
  const stringGetter = useStringGetter();
  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon="🇺🇸"
      slotTitle={stringGetter({ key: STRING_KEYS.TRUMPWIN_MARKET_LAUNCH_TITLE })}
      slotCustomContent={
        <span>
          {stringGetter({
            key: STRING_KEYS.TRUMPWIN_MARKET_LAUNCH_BODY,
            params: {
              MARKET: <span tw="text-color-text-1">{PREDICTION_MARKET.TRUMPWIN}</span>,
            },
          })}
        </span>
      }
      slotAction={
        <Link
          to={`${AppRoute.Trade}/${PREDICTION_MARKET.TRUMPWIN}`}
          tw="text-color-accent visited:text-color-accent"
        >
          {stringGetter({ key: STRING_KEYS.TRADE_NOW })} →
        </Link>
      }
    />
  );
};
