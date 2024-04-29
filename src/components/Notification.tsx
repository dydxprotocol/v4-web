import React, { type MouseEvent } from 'react';

import styled, { css } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import {
  NotificationStatus,
  type Notification as NotificationDataType,
} from '@/constants/notifications';

import { useNotifications } from '@/hooks/useNotifications';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';

type ElementProps = {
  notification: NotificationDataType;
  onClick?: () => void;
  slotIcon?: React.ReactNode;
  slotTitle?: React.ReactNode;
  slotTitleLeft?: React.ReactNode;
  slotTitleRight?: React.ReactNode;
  slotDescription?: React.ReactNode;
  slotCustomContent?: React.ReactNode;
  slotAction?: React.ReactNode;
  withClose?: boolean;
};

type StyleProps = {
  className?: string;
  isToast?: boolean;
};

export type NotificationProps = ElementProps & StyleProps;

export const Notification = ({
  className,
  isToast,
  notification,
  onClick,
  slotIcon,
  slotTitle,
  slotTitleLeft,
  slotTitleRight,
  slotDescription,
  slotCustomContent,
  slotAction,
  withClose = !isToast,
}: NotificationProps) => {
  const { markCleared, markSeen } = useNotifications();
  const slotContentOrDescription = slotCustomContent ?? slotDescription;

  return (
    <$Container className={className} isToast={isToast} onClick={onClick}>
      <$Header>
        {slotTitleLeft ?? (slotIcon && <$Icon>{slotIcon}</$Icon>)}
        <$Title>{slotTitle}</$Title>
        {slotTitleRight}
        {withClose && !isToast && (
          <$ActionItems>
            <$Output
              type={OutputType.RelativeTime}
              value={notification.timestamps[NotificationStatus.Triggered]}
            />

            {notification.status < NotificationStatus.Seen ? <$UnreadIndicator /> : null}

            {notification.status < NotificationStatus.Cleared ? (
              <$IconButton
                iconName={IconName.Close}
                shape={ButtonShape.Square}
                size={ButtonSize.XSmall}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();

                  if (notification.status < NotificationStatus.Seen) {
                    markSeen(notification);
                  } else if (notification.status < NotificationStatus.Cleared) {
                    markCleared(notification);
                  }
                }}
              />
            ) : null}
          </$ActionItems>
        )}
      </$Header>
      {slotContentOrDescription && <$Description>{slotContentOrDescription}</$Description>}
      {slotAction && <$Action>{slotAction}</$Action>}
    </$Container>
  );
};

const $Container = styled.div<{ isToast?: boolean }>`
  // Params
  --toast-icon-size: 1.75em;

  // Rules
  ${popoverMixins.popover}
  overflow: visible;
  padding: 1rem 1.25rem;

  ${({ isToast }) =>
    isToast
      ? css`
          padding: 1rem;
          box-shadow: 0 0 0 var(--border-width) var(--color-border),
            // border
            0 0 0.5rem 0.1rem var(--color-layer-2); // shadow
        `
      : css`
          flex: 1;
          background-color: transparent;
          border-radius: 0;
          backdrop-filter: none;
        `}
`;

const $Header = styled.header`
  ${layoutMixins.row}
  position: relative;
`;

const $Icon = styled.div`
  ${layoutMixins.row}
  float: left;

  margin-right: 0.5rem;

  line-height: 1;

  > svg,
  img {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const $Title = styled.div`
  flex: 1;

  font: var(--font-base-medium);
  color: var(--color-text-2);

  overflow: hidden;
  text-overflow: ellipsis;
`;

const $Description = styled.div`
  margin-top: 0.5rem;
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

const $Action = styled.div`
  margin-top: 0.5rem;
  font: var(--font-small-book);
`;

const $ActionItems = styled.div`
  min-width: fit-content;
  padding-left: 0.5rem;
  height: 100%;
  ${layoutMixins.row};
  justify-content: end;
  gap: 0.5rem;

  position: absolute;
  right: 0;
  top: 0;

  background-color: var(--color-layer-2);
  font: var(--font-mini-book);

  display: none;
  z-index: 1;

  ${$Container}:hover & {
    display: flex;
  }
`;

const $UnreadIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--color-accent);
  border: 1px solid var(--color-layer-2);
`;

const $Output = styled(Output)`
  color: var(--color-text-0);
`;

const $IconButton = styled(IconButton)`
  --button-border: none;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);
`;
