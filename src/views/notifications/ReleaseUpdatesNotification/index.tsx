import styled, { type AnyStyledComponent } from 'styled-components';

import { AssetIcon } from '@/components/AssetIcon';

import { Notification, NotificationProps } from '@/components/Notification';

export const ReleaseUpdatesNotification = ({
  isToast,
  notification,
  slotTitle,
  slotDescription,
}: NotificationProps) => (
  <Notification
    isToast={isToast}
    notification={notification}
    slotIcon={<AssetIcon symbol="DYDX" />}
    slotTitle={slotTitle}
    slotCustomContent={slotDescription}
  />
);

const Styled: Record<string, AnyStyledComponent> = {};
