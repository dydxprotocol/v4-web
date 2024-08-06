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
import styled from 'styled-components';

import { formMixins } from '@/styles/formMixins';
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
}: {
  children: React.ReactNode;
  className?: string;
  value: T;
  onValueChange: (value: T) => void;
  label?: React.ReactNode;
  withBlur?: boolean;
}) => {
  return (
    <Root value={value} onValueChange={onValueChange}>
      <$Trigger className={className} $withBlur={withBlur}>
        {label ? (
          <$WithLabel label={label}>
            <Value />
          </$WithLabel>
        ) : (
          <Value />
        )}
        {React.Children.toArray(children).length > 1 && (
          <Icon iconName={IconName.Triangle} tw="h-0.375 w-0.625 text-color-text-0" />
        )}
      </$Trigger>
      <Portal>
        <$Content className={className}>
          {/* <ScrollUpButton /> */}
          <Viewport>{children}</Viewport>
          {/* <ScrollDownButton /> */}
        </$Content>
      </Portal>
    </Root>
  );
};

export const SelectItem = <T extends string>({
  className,
  value,
  label,
}: {
  className?: string;
  value: T;
  label: React.ReactNode;
}) => (
  <$Item className={className} value={value}>
    <ItemText>{label}</ItemText>
    <$ItemIndicator>
      <CheckIcon />
    </$ItemIndicator>
  </$Item>
);
const $Trigger = styled(Trigger)<{ $withBlur?: boolean }>`
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

const $Content = styled(Content)`
  --select-menu-content-maxWidth: ;
  max-width: var(--select-menu-content-maxWidth);

  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
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
`;
