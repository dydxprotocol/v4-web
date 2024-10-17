import { useEffect } from 'react';

import { useCheckoutListenerByCheckoutId } from '@funkit/connect';
import { DateTime } from 'luxon';

import { FunkitDeposit } from '@/constants/funkit';

// eslint-disable-next-line import/no-cycle
import { Icon, IconName } from '@/components/Icon';
import { Notification, type NotificationProps } from '@/components/Notification';

import { useAppDispatch } from '@/state/appTypes';
import { updateFunkitDeposit } from '@/state/funkitDeposits';

import { getStringsForDateTimeDiff } from '@/lib/timeUtils';

type ElementProps = {
  deposit: FunkitDeposit;
};

export const FunkitDepositNotification = ({
  isToast,
  notification,
  deposit,
}: ElementProps & NotificationProps) => {
  // const stringGetter = useStringGetter();
  const { checkoutId, timestamp } = deposit;
  const dispatch = useAppDispatch();
  const funkitCheckoutItem = useCheckoutListenerByCheckoutId(checkoutId);

  useEffect(() => {
    if (funkitCheckoutItem?.state) {
      dispatch(updateFunkitDeposit({ ...deposit, status: funkitCheckoutItem?.state }));
    }
  }, [funkitCheckoutItem?.state, dispatch, deposit]);

  const timeDiff = getStringsForDateTimeDiff(DateTime.fromSeconds(timestamp));
  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<Icon iconName={IconName.FunkitInstant} />}
      slotTitle="Instant deposit in progress"
      slotCustomContent={<span>{`Deposit started ${timeDiff.timeString} ago`}</span>}
    />
  );
};
