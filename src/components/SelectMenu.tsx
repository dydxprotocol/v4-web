import React from 'react';

import { CheckIcon } from '@radix-ui/react-icons';
import {
  Content,
  Item,
  ItemIndicator,
  ItemText,
  Portal,
  Root,
  Trigger,
  Value,
  Viewport,
} from '@radix-ui/react-select';
import styled, { css, CSSProp } from 'styled-components';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { WithLabel } from '@/components/WithLabel';

import { Icon, IconName } from './Icon';

export const SelectMenu = <T extends string>({
  children,
  className,
  value,
  onValueChange,
  label,
  withBlur,
  withPortal = true,
  fullWidthPopper = false,
  contentCss,
  slotTrigger,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  value: T;
  onValueChange: (value: T) => void;
  label?: React.ReactNode;
  withBlur?: boolean;
  withPortal?: boolean;
  fullWidthPopper?: boolean;
  slotTrigger?: React.ReactNode;

  // Content CSS Props
  contentCss?: CSSProp;

  // Content Props
  position?: 'item-aligned' | 'popper';
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
}) => {
  return (
    <Root value={value} onValueChange={onValueChange}>
      {slotTrigger ?? (
        <SelectMenuTrigger className={className} $withBlur={withBlur}>
          {label ? (
            <$WithLabel label={label}>
              <Value />
            </$WithLabel>
          ) : (
            <Value />
          )}
          {React.Children.toArray(children).length > 1 && (
            <Icon
              iconName={IconName.Triangle}
              tw="h-0.375 min-h-0.375 w-0.625 min-w-0.625 text-color-text-0"
            />
          )}
        </SelectMenuTrigger>
      )}

      {withPortal ? (
        <Portal>
          <$Content {...props} $fullWidthPopper={fullWidthPopper} css={contentCss}>
            {/* <ScrollUpButton /> */}
            <Viewport>{children}</Viewport>
            {/* <ScrollDownButton /> */}
          </$Content>
        </Portal>
      ) : (
        <$Content {...props} $fullWidthPopper={fullWidthPopper} css={contentCss}>
          {/* <ScrollUpButton /> */}
          <Viewport>{children}</Viewport>
          {/* <ScrollDownButton /> */}
        </$Content>
      )}
    </Root>
  );
};

export const SelectItem = <T extends string>({
  className,
  value,
  label,
  withIcon = true,
}: {
  className?: string;
  value: T;
  label: React.ReactNode;
  withIcon?: boolean;
}) => (
  <$Item className={className} value={value}>
    <ItemText>{label}</ItemText>
    {withIcon && (
      <$ItemIndicator>
        <CheckIcon />
      </$ItemIndicator>
    )}
  </$Item>
);

export const SelectMenuTrigger = styled(Trigger)<{ $withBlur?: boolean }>`
  --select-menu-trigger-maxWidth: ;
  max-width: var(--select-menu-trigger-maxWidth);
  ${popoverMixins.trigger}
  ${({ $withBlur }) => $withBlur && popoverMixins.backdropOverlay}

  > * {
    text-align: start;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const $Content = styled(Content)<{ $fullWidthPopper?: boolean }>`
  --select-menu-content-maxWidth: ;
  max-width: var(--select-menu-content-maxWidth);

  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}

  ${({ $fullWidthPopper }) =>
    $fullWidthPopper &&
    css`
      width: var(--radix-select-trigger-width);
      --select-menu-content-maxWidth: var(--radix-select-trigger-width);
    `}
`;

const $Item = styled(Item)`
  ${popoverMixins.item}
`;

const $ItemIndicator = styled(ItemIndicator)`
  margin-left: auto;
  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);
`;

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
  border-radius: 0;

  > * {
    ${layoutMixins.textTruncate}
  }
`;
