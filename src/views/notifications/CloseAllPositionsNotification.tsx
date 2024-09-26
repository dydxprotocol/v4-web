import styled from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { LocalCloseAllPositionsData } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import { OrderStatusIcon } from '../OrderStatusIcon';

type ElementProps = {
  localCloseAllPositions: LocalCloseAllPositionsData;
};

export const CloseAllPositionsNotification = ({
  isToast,
  localCloseAllPositions,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();
  const { closeAllPositions } = useSubaccount();

  const { submittedOrderClientIds, filledOrderClientIds, failedOrderClientIds } =
    localCloseAllPositions;

  const numPositions = submittedOrderClientIds.length;
  const numClosed = filledOrderClientIds.length;
  const numFailed = failedOrderClientIds.length;

  const isPending = numClosed + numFailed < numPositions;
  const allFilled = numClosed === numPositions;
  const allCanceled = numFailed === numPositions;

  let closePositionsStatus = <LoadingSpinner tw="text-color-accent [--spinner-width:0.9375rem]" />;
  if (!isPending) {
    let [statusStringKey, statusForIcon] = [
      STRING_KEYS.PARTIALLY_FILLED,
      AbacusOrderStatus.PartiallyCanceled.rawValue,
    ];
    if (allFilled) {
      [statusStringKey, statusForIcon] = [
        STRING_KEYS.ORDER_FILLED,
        AbacusOrderStatus.Filled.rawValue,
      ];
    } else if (allCanceled) {
      [statusStringKey, statusForIcon] = [STRING_KEYS.CANCELED, AbacusOrderStatus.Pending.rawValue];
    }

    closePositionsStatus = (
      <span tw="row gap-[0.5ch] text-color-text-0 font-small-book">
        {stringGetter({ key: statusStringKey })}
        <OrderStatusIcon status={statusForIcon} />
      </span>
    );
  }

  const showTryAgain = !isPending && numFailed > 0;
  const tryAgainAction = (
    <Button
      tw="w-full"
      size={ButtonSize.Small}
      onClick={closeAllPositions}
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
