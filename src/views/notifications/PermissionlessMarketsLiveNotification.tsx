import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';
import { Tag, TagSign } from '@/components/Tag';

export type PermissionlessMarketsLiveNotificationProps = NotificationProps;

export const PermissionlessMarketsLiveNotification = ({
  isToast,
  notification,
}: PermissionlessMarketsLiveNotificationProps) => {
  const stringGetter = useStringGetter();

  return (
    <$Notification
      isToast={isToast}
      notification={notification}
      slotTitle={
        <span tw="inline-block">
          {stringGetter({
            key: STRING_KEYS.PERMISSIONLESS_LIVE,
          })}{' '}
          <Tag sign={TagSign.Positive}>{stringGetter({ key: STRING_KEYS.NEW })}</Tag>
        </span>
      }
      slotDescription={
        <div tw="relative flex flex-row">
          <div tw="flex flex-col">
            <span>{stringGetter({ key: STRING_KEYS.INSTANTLY_LAUNCH_BY_DEPOSITING })}</span>
          </div>
          <$SpaceshipImg src="/hedgie-spaceship.png" alt="hedgie-spaceship" />
        </div>
      }
    />
  );
};

const $Notification = styled(Notification)`
  --action-marginTop: 0.75rem;
`;

const $SpaceshipImg = styled.img`
  width: 3.5rem;
  min-width: 3.5rem;
  height: 3.5rem;
`;
