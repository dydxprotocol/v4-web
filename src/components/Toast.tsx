import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Root, Action, Close } from '@radix-ui/react-toast';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { popoverMixins } from '@/styles/popoverMixins';

import { Notification, type NotificationProps } from '@/components/Notification';

import { IconButton } from './IconButton';
import { IconName } from './Icon';

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean, isClosedFromTimeout?: boolean) => void;
  actionDescription?: string;
  actionAltText?: string;
  sensitivity?: 'foreground' | 'background';
  duration?: number;
  lastUpdated?: number;
};

type StyleProps = {
  className?: string;
};

type ToastProps = NotificationProps & ElementProps & StyleProps;

export const Toast = ({
  className,
  isOpen = true,
  notification,
  onClick,
  setIsOpen,
  slotIcon,
  slotTitle,
  slotTitleLeft,
  slotTitleRight,
  slotDescription,
  slotCustomContent,
  slotAction,
  actionDescription = '',
  actionAltText = actionDescription,
  sensitivity = 'background',
  duration = Infinity,
  lastUpdated,
}: ToastProps) => {
  // Timeout
  const timeout = useRef<number>();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Restart toast timer when `lastUpdated` timestamp changes or toast is paused + resumed
    if (timeout.current) clearTimeout(timeout.current);

    if (isOpen && !isPaused && duration !== Infinity)
      timeout.current = globalThis.setTimeout(() => {
        setIsOpen?.(false, true);
      }, duration) as unknown as number;
  }, [isOpen, isPaused, duration, lastUpdated]);

  return (
    <$Root
      className={className}
      type={sensitivity}
      duration={Infinity}
      open={isOpen}
      onOpenChange={setIsOpen}
      onPause={() => setIsPaused(true)}
      onResume={() => setIsPaused(false)}
      onClick={() => {
        setIsOpen?.(false, false);
        onClick?.();
      }}
    >
      <Close asChild>
        <$CloseButton
          iconName={IconName.Close}
          shape={ButtonShape.Square}
          size={ButtonSize.XSmall}
        />
      </Close>

      {slotCustomContent ?? (
        <$Notification
          isToast
          notification={notification}
          slotIcon={slotIcon}
          slotTitle={slotTitle}
          slotTitleLeft={slotTitleLeft}
          slotTitleRight={slotTitleRight}
          slotDescription={slotDescription}
          slotAction={
            actionDescription && (
              <$Action asChild altText={actionAltText}>
                {slotAction}
              </$Action>
            )
          }
        />
      )}
    </$Root>
  );
};

const $Root = styled(Root)`
  // Params
  --toast-transition-duration: 0.5s;

  // Computed
  --x: var(--radix-toast-swipe-move-x, 0px);
  --y: var(--radix-toast-swipe-move-y, 0px);

  // Rules
  transition: var(--toast-transition-duration) var(--ease-out-expo);

  margin-left: calc(var(--border-width) + 0.6rem); // border + shadow
  margin-right: var(--border-width); // border

  display: grid; // height transition
  grid-template-rows: 1fr; // height transition
  /* grid-template-rows: 1fr var(--toasts-gap); // height transition */

  translate: var(--x) var(--y);
  will-change: translate, margin-top;

  /* margin-bottom: var(--toasts-gap); */

  &[data-swipe-direction='right'] {
    &[data-state='open'] {
      align-items: end;
      transform-origin: left bottom;

      animation: ${keyframes`
          from {
            /* scale: 0; */
            grid-template-rows: 0fr; // height transition
            /* grid-template-rows: 0fr 0fr; // height transition */

            margin-top: calc(-1 * var(--toasts-gap));
          }
        `} var(--toast-transition-duration) var(--ease-out-expo),
        ${keyframes`
          from {
            opacity: 0;
            /* filter: blur(1px); */
          }
        `} var(--toast-transition-duration) var(--ease-out-expo),
        ${keyframes`
          33% {
            /* scale: 1.05; */
            /* filter: brightness(120%); */
            filter: drop-shadow(0 0 var(--color-text-1));
          }
        `} calc(var(--toast-transition-duration) * 3) 0.1s;
    }

    &[data-state='closed'] {
      align-items: start;

      animation: ${keyframes``} var(--toast-transition-duration) var(--ease-out-expo); // delay Radix's DOM removal for [data-state='closed'] transition
    }
  }

  &:focus-visible {
    outline: none;
  }

  &:active[data-swipe-direction='right'] {
    cursor: e-resize;
  }
  &:active[data-swipe-direction='up'] {
    cursor: n-resize;
  }

  &:focus:not([data-swipe='end']) & {
    outline: var(--color-accent) 1px solid;
  }

  &[data-swipe='move'] {
    transition-property: opacity;
    opacity: 0.98;

    cursor: grabbing;
    * {
      cursor: inherit;
    }

    & > * {
      opacity: 0.5;
    }
  }

  &[data-state='closed'],
  &[data-swipe='end'] {
    z-index: -1;
    grid-template-rows: 0fr; // height transition
    margin-top: 0;
    margin-bottom: 0;
    filter: blur(3px);
    pointer-events: none;

    &[data-swipe-direction='right'] {
      --x: calc(100% + 2rem);
    }
  }

  > div {
    min-height: 0; // height transition
    transition: scale var(--toast-transition-duration) var(--ease-out-expo);
  }

  &:is(:active:not(:not(:focus):focus-within), [data-swipe='move']) > div {
    scale: 0.95;
    transition-duration: 5s;
  }
`;

const $Notification = styled(Notification)`
  // Params
  --toast-icon-size: 1.75em;

  // Rules
  ${popoverMixins.popover}
  overflow: visible;
  padding: 1rem;
  box-shadow: 0 0 0 var(--border-width) var(--color-border),
    // border
    0 0 0.5rem 0.1rem var(--color-layer-2); // shadow

  > * {
    transition: opacity 0.2s;
  }
`;

const $CloseButton = styled(IconButton)`
  --button-textColor: var(--color-text-0);
  --button-border: none;
  --button-icon-size: 0.85em;
  display: none;

  /* float: right; */
  margin: -0.42rem -0.42rem -0.42rem 0.42rem;

  // Absolute
  position: absolute;
  top: 0;
  right: 0;

  border: solid var(--border-width) var(--color-border);
  border-radius: 50%;

  ${$Root}:hover & {
    display: block;
    z-index: 2;
  }
`;

const $Action = styled(Action)`
  margin-top: 0.5rem;
`;
