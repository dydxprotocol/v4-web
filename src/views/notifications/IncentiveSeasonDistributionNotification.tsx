import styled, { type AnyStyledComponent } from 'styled-components';

import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Notification, NotificationProps } from '@/components/Notification';
import { Output, OutputType } from '@/components/Output';

type ElementProps = {
  data: {
    points: number;
    chainTokenLabel: string;
  };
};

export type IncentiveSeasonDistributionNotificationProps = NotificationProps & ElementProps;

export const IncentiveSeasonDistributionNotification = ({
  isToast,
  data,
  notification,
}: IncentiveSeasonDistributionNotificationProps) => {
  const { chainTokenLabel, points } = data;

  return (
    <$Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<Icon iconName={IconName.RewardStar} />}
      slotTitle="Season 3 launch rewards have been distributed!"
      slotCustomContent={
        <$Details
          items={[
            {
              key: 'season_distribution',
              label: 'Season 3 rewards',
              value: <$Output type={OutputType.Asset} value={points} tag={chainTokenLabel} />,
            },
          ]}
        />
      }
    />
  );
};
const $Details = styled(Details)`
  --details-item-height: 1.5rem;

  dd {
    color: var(--color-text-2);
  }
`;

const $Notification = styled(Notification)`
  background-image: url('/dots-background-2.svg');
  background-size: cover;
`;

const $Output = styled(Output)`
  &:before {
    content: '+';
    color: var(--color-success);
    margin-right: 0.5ch;
  }
`;
