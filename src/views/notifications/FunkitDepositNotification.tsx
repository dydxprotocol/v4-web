import { useEffect } from 'react';

import { SelectedHomeTab, useAccountModal, useCheckoutListenerByCheckoutId } from '@funkit/connect';

import { FunkitDeposit } from '@/constants/funkit';
import { STRING_KEYS } from '@/constants/localization';

import { useFlushFunkitTheme } from '@/hooks/useFlushFunkitTheme';
import { useStringGetter } from '@/hooks/useStringGetter';

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
  const stringGetter = useStringGetter();
  const { checkoutId } = deposit;
  const dispatch = useAppDispatch();
  const funkitCheckoutItem = useCheckoutListenerByCheckoutId(checkoutId);
  const { openAccountModal } = useAccountModal();
  const flushTheme = useFlushFunkitTheme();

  useEffect(() => {
    if (funkitCheckoutItem?.state) {
      dispatch(updateFunkitDeposit({ ...deposit, status: funkitCheckoutItem.state }));
    }
  }, [funkitCheckoutItem?.state, dispatch, deposit]);

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<Icon iconName={IconName.FunkitInstant} tw="text-color-accent" />}
      slotTitle={stringGetter({ key: STRING_KEYS.INSTANT_DEPOSIT_IN_PROGRESS })}
      slotCustomContent={<span>{stringGetter({ key: STRING_KEYS.DEPOSIT_SHORTLY })}</span>}
      slotAction={
        <Link
          onClick={() => {
            flushTheme();
            openAccountModal?.(SelectedHomeTab.CHECKOUTS);
          }}
          isAccent
        >
          {stringGetter({ key: STRING_KEYS.VIEW_DEPOSIT_STATUS })} →
        </Link>
      }
    />
  );
};
