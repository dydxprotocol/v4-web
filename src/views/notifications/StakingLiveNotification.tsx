import { NOTIFICATIONS_STRING_KEYS } from '@dydxprotocol/v4-localization';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Button } from '@/components/Button';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

export const StakingLiveNotification = ({ isToast, notification }: NotificationProps) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const { chainTokenLabel } = useTokenConfigs();

  return (
    <$Notification
      isToast={isToast}
      notification={notification}
      slotTitle={stringGetter({ key: NOTIFICATIONS_STRING_KEYS.IN_APP_STAKING_LIVE_TITLE })}
      slotCustomContent={
        <div tw="flex justify-between">
          <div tw="flex flex-col justify-between gap-0.5">
            {stringGetter({ key: NOTIFICATIONS_STRING_KEYS.IN_APP_STAKING_LIVE_BODY })}
            <Button
              onClick={() => navigate(`${chainTokenLabel}`)}
              action={ButtonAction.Primary}
              size={ButtonSize.Small}
              tw="w-min"
            >
              {stringGetter({ key: STRING_KEYS.STAKE_NOW })}
            </Button>
          </div>
          <img
            src="/staking.png"
            alt={stringGetter({ key: STRING_KEYS.STAKING })}
            tw="h-5 w-5 self-center"
          />
        </div>
      }
    />
  );
};

const $Notification = styled(Notification)`
  --relativeTime-backgroundColor: transparent;

  background: linear-gradient(to right, var(--color-layer-3) 33%, var(--color-positive-dark) 100%);
`;
