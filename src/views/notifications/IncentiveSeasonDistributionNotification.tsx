import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
// eslint-disable-next-line import/no-cycle
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
  const stringGetter = useStringGetter();
  const { chainTokenLabel, points } = data;

  return (
    <$Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<Icon iconName={IconName.RewardStar} />}
      slotTitle={stringGetter({
        key: 'NOTIFICATIONS.REWARDS_DISTRIBUTED.TITLE',
        params: { SEASON_NUMBER: 4 },
      })}
      slotCustomContent={
        <$Details
          items={[
            {
              key: 'season_distribution',
              label: stringGetter({
                key: STRING_KEYS.LAUNCH_INCENTIVES_SEASON_REWARDS,
                params: { SEASON_NUMBER: 4 },
              }),
              value: <$Output type={OutputType.Asset} value={points} tag={chainTokenLabel} />,
            },
          ]}
        />
      }
    />
  );
};
const $Details = styled(Details)`
  --details-item-vertical-padding: 0;

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
