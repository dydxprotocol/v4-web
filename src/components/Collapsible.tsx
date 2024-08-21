import React from 'react';

import { Content, Root, Trigger } from '@radix-ui/react-collapsible';
import styled, { css, keyframes } from 'styled-components';

import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';
import { HorizontalSeparatorFiller } from '@/components/Separator';

type ElementProps = {
  defaultOpen?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: React.ReactNode;
  triggerIcon?: IconName;
  slotTrigger?: React.ReactNode;
  children: React.ReactNode;
  withTrigger?: boolean;
};

type StyleProps = {
  className?: string;
  transitionDuration?: number;
  triggerIconSide?: 'left' | 'right';
  fullWidth?: boolean;
};

export type CollapsibleProps = ElementProps & StyleProps;

export const Collapsible = ({
  defaultOpen = false,
  disabled,
  open,
  onOpenChange,
  label,
  children,
  transitionDuration,
  triggerIcon = IconName.Caret,
  triggerIconSide = 'left',
  slotTrigger,
  fullWidth,
  className,
  withTrigger = true,
}: CollapsibleProps) => {
  const trigger = slotTrigger ? (
    <div tw="flex items-center gap-[0.5em]">
      {triggerIconSide === 'right' && label}
      <Trigger className={className} disabled={disabled} asChild>
        {slotTrigger}
      </Trigger>
      {triggerIconSide === 'left' && label}
    </div>
  ) : (
    <$Trigger className={className} disabled={disabled}>
      {triggerIconSide === 'right' && (
        <>
          {label}
          {fullWidth && <HorizontalSeparatorFiller />}
        </>
      )}
      <$TriggerIcon>
        <Icon iconName={triggerIcon} />
      </$TriggerIcon>
      {triggerIconSide === 'left' && (
        <>
          {fullWidth && <HorizontalSeparatorFiller />}
          {label}
        </>
      )}
    </$Trigger>
  );

  return (
    <$Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      {withTrigger && trigger}
      <$Content $transitionDuration={transitionDuration}>{children}</$Content>
    </$Root>
  );
};
const $Root = styled(Root)`
  display: grid;

  &[data-state='open'] {
    gap: 0.5rem;
  }
`;

const $Trigger = styled(Trigger)`
  ${popoverMixins.trigger}
  --trigger-textColor: inherit;
  --trigger-icon-width: 0.75em;
  --trigger-icon-color: inherit;
`;
const $TriggerIcon = styled.span`
  width: var(--trigger-icon-width);

  display: inline-flex;
  transition: rotate 0.3s var(--ease-out-expo);
  color: var(--trigger-icon-color);

  ${$Trigger}[data-state='open'] & {
    rotate: -0.5turn;
  }
`;

const $Content = styled(Content)<{ $transitionDuration?: number }>`
  display: grid;
  --transition-duration: 0.25s;

  ${({ $transitionDuration }) =>
    $transitionDuration &&
    css`
      --transition-duration: ${$transitionDuration}s;
    `}

  @media (prefers-reduced-motion: no-preference) {
    &[data-state='open'] {
      animation: ${keyframes`
        from {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          scale: 0.8;
          filter: blur(2px);
        }

        to {
          overflow: hidden;
          max-height: var(--radix-collapsible-content-height);
        }
      `} var(--transition-duration) var(--ease-out-expo);
    }

    &[data-state='closed'] {
      animation: ${keyframes`
        from {
          overflow: hidden;
          max-height: var(--radix-collapsible-content-height);
        }

        to {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          scale: 0.8;
          filter: blur(2px);
        }
      `} var(--transition-duration) var(--ease-out-expo);
    }
  }
`;
