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
    BLOCK_REWARD_AMOUNT: string;
    BLOCK_REWARD_HEIGHT: string;
    BLOCK_REWARD_TIME_MILLISECONDS: string;
    TOKEN_NAME: string;
  };
};

export type BlockRewardNotificationProps = NotificationProps & ElementProps;

export const BlockRewardNotification = ({
  isToast,
  data,
  notification,
}: BlockRewardNotificationProps) => {
  const stringGetter = useStringGetter();
  const { BLOCK_REWARD_AMOUNT, TOKEN_NAME } = data;

  return (
    <$Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<Icon iconName={IconName.RewardStar} />}
      slotTitle={stringGetter({ key: STRING_KEYS.TRADING_REWARD_RECEIVED })}
      slotCustomContent={
        <$Details
          items={[
            {
              key: 'block_reward',
              label: stringGetter({ key: STRING_KEYS.BLOCK_REWARD }),
              value: (
                <$Output type={OutputType.Asset} value={BLOCK_REWARD_AMOUNT} tag={TOKEN_NAME} />
              ),
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
