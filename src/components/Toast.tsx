import React, { useEffect, useRef, useState } from 'react';

import { Root, Title, Description, Action, Close } from '@radix-ui/react-toast';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { IconButton } from './IconButton';
import { CloseIcon } from '@/icons';

import styled, { keyframes } from 'styled-components';
import { popoverMixins } from '@/styles/popoverMixins';
import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean, isClosedFromTimeout?: boolean) => void;
  slotIcon?: React.ReactNode;
  slotTitle?: React.ReactNode;
  slotDescription?: React.ReactNode;
  slotAction?: React.ReactNode;
  actionDescription?: string;
  actionAltText?: string;
  sensitivity?: 'foreground' | 'background';
  duration?: number;
  lastUpdated?: number;
};

type StyleProps = {};

export const Toast = ({
  isOpen = true,
  setIsOpen,
  slotIcon,
  slotTitle,
  slotDescription,
  slotAction,
  actionDescription = '',
  actionAltText = actionDescription,
  sensitivity = 'background',
  duration = Infinity,
  lastUpdated,
}: ElementProps & StyleProps) => {
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
      type={sensitivity}
      duration={Infinity}
      open={isOpen}
      onOpenChange={setIsOpen}
      onPause={() => setIsPaused(true)}
      onResume={() => setIsPaused(false)}
    >
      <div>
        <$Container>
          <$Header>
            {slotIcon && <$Icon>{slotIcon}</$Icon>}

            <Close asChild>
              <$CloseButton
                iconComponent={CloseIcon}
                shape={ButtonShape.Square}
                size={ButtonSize.XSmall}
              />
            </Close>

            <$Title>{slotTitle}</$Title>
          </$Header>

          <$Description>{slotDescription}</$Description>
          {actionDescription && (
            <$Action asChild altText={actionAltText}>
              {slotAction}
            </$Action>
          )}
        </$Container>
      </div>
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

  margin-bottom: var(--toasts-gap);

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

  &:focus {
    outline: none;
  }

  &:active[data-swipe-direction='right'] {
    cursor: e-resize;
  }
  &:active[data-swipe-direction='up'] {
    cursor: n-resize;
  }

  &[data-swipe='move'] {
    transition-property: opacity;
    opacity: 0.98;

    cursor: grabbing;
    * {
      cursor: inherit;
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

const $Container = styled.div`
  // Params
  --toast-icon-size: 1.75em;

  // Rules
  ${popoverMixins.popover}
  padding: 1rem;
  box-shadow: 0 0 0 var(--border-width) var(--color-border),
    // border
    0 0 0.5rem 0.1rem var(--color-layer-2); // shadow

  ${$Root}:focus:not([data-swipe='end']) & {
    outline: var(--color-accent) 1px solid;
  }

  > * {
    transition: opacity 0.2s;
  }
  ${$Root}[data-swipe='move'] & > * {
    opacity: 0.5;
  }
`;

const $Header = styled.header`
  display: block;
`;

const $Icon = styled.div`
  ${layoutMixins.row}

  float: left;

  width: 1em;
  height: 1em;

  margin-right: 0.4em;

  line-height: 1;
`;

const $CloseButton = styled(IconButton)`
  --button-textColor: var(--color-text-0);
  --button-border: none;
  --button-icon-size: 0.85em;

  float: right;
  margin: -0.42rem -0.42rem -0.42rem 0.42rem;
`;

const $Title = styled(Title)`
  flex: 1;

  font: var(--font-base-medium);
  color: var(--color-text-2);

  overflow: hidden;
  text-overflow: ellipsis;
`;

const $Description = styled(Description)`
  margin-top: 0.5rem;
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

const $Action = styled(Action)`
  margin-top: 0.5rem;
`;
