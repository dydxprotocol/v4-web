import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { OrderStatus } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { LocalCloseAllPositionsData, PlaceOrderStatuses } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import { useAppSelector } from '@/state/appTypes';

import { isPresent } from '@/lib/typeUtils';

import { OrderStatusIconNew } from '../OrderStatusIcon';

type ElementProps = {
  localCloseAllPositions: LocalCloseAllPositionsData;
};

export const CloseAllPositionsNotification = ({
  isToast,
  localCloseAllPositions,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();

  const { clientIds } = localCloseAllPositions;
  const allPlaceOrders = useAppSelector((s) => s.localOrders.localPlaceOrders);
  const placeOrderStatuses = clientIds
    .map((clientId) => allPlaceOrders[clientId])
    .filter(isPresent);

  const numPositions = placeOrderStatuses.length;
  const numClosed = placeOrderStatuses.filter(
    (o) => o.submissionStatus === PlaceOrderStatuses.Filled
  ).length;
  const numFailed = placeOrderStatuses.filter(
    (o) =>
      o.submissionStatus === PlaceOrderStatuses.FailedSubmission ||
      o.submissionStatus === PlaceOrderStatuses.Canceled
  ).length;

  const isPending = numClosed + numFailed < numPositions;
  const allFilled = numClosed === numPositions;
  const allCanceled = numFailed === numPositions;

  let closePositionsStatus = <LoadingSpinner tw="text-color-accent [--spinner-width:0.9375rem]" />;
  if (!isPending) {
    let [statusStringKey, statusForIcon] = [
      STRING_KEYS.PARTIALLY_FILLED,
      OrderStatus.PartiallyCanceled,
    ];
    if (allFilled) {
      [statusStringKey, statusForIcon] = [STRING_KEYS.ORDER_FILLED, OrderStatus.Filled];
    } else if (allCanceled) {
      [statusStringKey, statusForIcon] = [STRING_KEYS.CANCELED, OrderStatus.Pending];
    }

    closePositionsStatus = (
      <span tw="row gap-[0.5ch] text-color-text-0 font-small-book">
        {stringGetter({ key: statusStringKey })}
        <OrderStatusIconNew status={statusForIcon} />
      </span>
    );
  }

  const showTryAgain = !isPending && numFailed > 0;
  const tryAgainAction = (
    <Button
      tw="w-full"
      size={ButtonSize.Small}
      onClick={() => accountTransactionManager.closeAllPositions()}
      action={ButtonAction.Secondary}
    >
      {stringGetter({ key: STRING_KEYS.TRY_AGAIN })}
    </Button>
  );

  const customContent = (
    <$Details
      items={[
        {
          key: 'positions-closed',
          label: (
            <span tw="row gap-[0.5ch]">{stringGetter({ key: STRING_KEYS.POSITIONS_CLOSED })}</span>
          ),
          value: (
            <span>
              <$Highlighted>{numClosed}</$Highlighted> / {numPositions}
            </span>
          ),
        },
      ]}
    />
  );

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotTitle={stringGetter({ key: STRING_KEYS.CLOSE_ALL_POSITIONS })}
      slotTitleRight={closePositionsStatus}
      slotCustomContent={customContent}
      slotAction={showTryAgain ? tryAgainAction : undefined}
    />
  );
};

const $Details = styled(Details)`
  --details-item-height: 1rem;

  div {
    padding: 0.25rem 0 0;
  }
`;

const $Highlighted = styled.span`
  color: var(--color-text-2);
`;
