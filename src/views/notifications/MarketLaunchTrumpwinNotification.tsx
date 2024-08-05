import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { AppRoute } from '@/constants/routes';

import { Notification, type NotificationProps } from '@/components/Notification';

export const MarketLaunchTrumpwinNotification = ({ isToast, notification }: NotificationProps) => {
  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon="🇺🇸"
      slotTitle="Trade the U.S. election!"
      slotCustomContent={
        <span>
          <$Market>TRUMPWIN-USD</$Market> is now live. This market will settle at $1 if Donald J.
          Trump wins the election. Otherwise, it will settle at $0.00001.
        </span>
      }
      slotAction={<$Link to={`${AppRoute.Trade}/TRUMP-USD`}>Trade now →</$Link>}
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
