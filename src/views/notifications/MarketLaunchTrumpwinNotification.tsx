import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
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
            params: { MARKET: <$Market>TRUMPWIN-USD</$Market> },
          })}
        </span>
      }
      slotAction={
        <$Link to={`${AppRoute.Trade}/TRUMP-USD`}>
          {stringGetter({ key: STRING_KEYS.TRADE_NOW })} →
        </$Link>
      }
    />
  );
};

const $Market = styled.span`
  color: var(--color-text-1);
`;

const $Link = styled(Link)`
  color: var(--color-accent);

  &:visited {
    color: var(--color-accent);
  }
`;
