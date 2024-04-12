import styled, { AnyStyledComponent } from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { TriggerOrderNotificationTypes, TriggerOrderStatus } from '@/constants/notifications';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Notification, NotificationProps } from '@/components/Notification';
import { OrderStatusIcon } from '@/views/OrderStatusIcon';

type ElementProps = {
  type: TriggerOrderNotificationTypes;
  status: TriggerOrderStatus;
};

export type TriggerOrderNotificationProps = NotificationProps & ElementProps;

export const TriggerOrderNotification = ({
  type,
  status,
  slotIcon,
  slotTitle,
  slotDescription,
  isToast,
  notification,
}: TriggerOrderNotificationProps) => {
  const stringGetter = useStringGetter();

  const getOrderStatusFromType = () => {
    switch (status) {
      case TriggerOrderStatus.Error:
        return stringGetter({
          key: STRING_KEYS.ERROR,
        });
      case TriggerOrderStatus.Success:
        switch (type) {
          case TriggerOrderNotificationTypes.Cancelled:
            return stringGetter({
              key: STRING_KEYS.REMOVED,
            });
          case TriggerOrderNotificationTypes.Created:
            return stringGetter({
              key: STRING_KEYS.CREATED,
            });
        }
    }
  };

  const getIconFromType = () => {
    switch (status) {
      case TriggerOrderStatus.Error:
        return <Styled.WarningIcon iconName={IconName.Warning} />;
      case TriggerOrderStatus.Success:
        return OrderStatusIcon({ status: AbacusOrderStatus.filled.rawValue });
    }
  };

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={slotIcon}
      slotTitle={slotTitle}
      slotDescription={slotDescription}
      slotTitleRight={
        <Styled.Status>
          {getOrderStatusFromType()}
          {getIconFromType()}
        </Styled.Status>
      }
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Label = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

Styled.Status = styled(Styled.Label)`
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

Styled.WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
