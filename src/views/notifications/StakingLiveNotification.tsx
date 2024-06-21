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
        <$Container>
          <$LeftColumn>
            {stringGetter({ key: NOTIFICATIONS_STRING_KEYS.IN_APP_STAKING_LIVE_BODY })}
            <$Button
              onClick={() => navigate(`${chainTokenLabel}`)}
              action={ButtonAction.Primary}
              size={ButtonSize.Small}
            >
              {stringGetter({ key: STRING_KEYS.STAKE_NOW })}
            </$Button>
          </$LeftColumn>
          <$Img src="/staking.png" alt={stringGetter({ key: STRING_KEYS.STAKING })} />
        </$Container>
      }
    />
  );
};

const $Notification = styled(Notification)`
  --relativeTime-backgroundColor: transparent;

  background: linear-gradient(to right, var(--color-layer-3) 33%, var(--color-positive-dark) 100%);
`;

const $Container = styled.div`
  display: flex;
  justify-content: space-between;
`;

const $LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
`;

const $Button = styled(Button)`
  width: min-content;
`;

const $Img = styled.img`
  width: 5rem;
  height: 5rem;

  align-self: center;
`;
