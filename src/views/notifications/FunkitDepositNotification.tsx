import { useEffect } from 'react';

import { SelectedHomeTab, useAccountModal, useCheckoutListenerByCheckoutId } from '@funkit/connect';

import { FunkitDeposit } from '@/constants/funkit';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

import { useAppDispatch } from '@/state/appTypes';
import { updateFunkitDeposit } from '@/state/funkitDeposits';

type ElementProps = {
  deposit: FunkitDeposit;
};

export const FunkitDepositNotification = ({
  isToast,
  notification,
  deposit,
}: ElementProps & NotificationProps) => {
  // const stringGetter = useStringGetter();
  const { checkoutId } = deposit;
  const dispatch = useAppDispatch();
  const funkitCheckoutItem = useCheckoutListenerByCheckoutId(checkoutId);
  const { openAccountModal } = useAccountModal();

  useEffect(() => {
    if (funkitCheckoutItem?.state) {
      dispatch(updateFunkitDeposit({ ...deposit, status: funkitCheckoutItem?.state }));
    }
  }, [funkitCheckoutItem?.state, dispatch, deposit]);

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<Icon iconName={IconName.FunkitInstant} tw="text-color-accent" />}
      slotTitle="Instant deposit in progress"
      slotCustomContent={<span>Your deposit should arrive shortly</span>}
      slotAction={
        <Link onClick={() => openAccountModal?.(SelectedHomeTab.CHECKOUTS)} isAccent>
          View status →
        </Link>
      }
    />
  );
};
