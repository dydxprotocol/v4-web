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
import styled, { type AnyStyledComponent } from 'styled-components';

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
      <Styled.Trigger className={className} $withBlur={withBlur}>
        {label ? (
          <Styled.WithLabel label={label}>
            <Value />
          </Styled.WithLabel>
        ) : (
          <Value />
        )}
        {React.Children.toArray(children).length > 1 && (
          <Styled.TriggerIcon iconName={IconName.Triangle} />
        )}
      </Styled.Trigger>
      <Portal>
        <Styled.Content className={className}>
          {/* <ScrollUpButton /> */}
          <Viewport>{children}</Viewport>
          {/* <ScrollDownButton /> */}
        </Styled.Content>
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
  label: string;
}) => (
  <Styled.Item className={className} value={value}>
    <ItemText>{label}</ItemText>
    <Styled.ItemIndicator>
      <CheckIcon />
    </Styled.ItemIndicator>
  </Styled.Item>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Trigger = styled(Trigger)<{ $withBlur?: boolean }>`
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

Styled.Content = styled(Content)`
  --select-menu-content-maxWidth: ;
  max-width: var(--select-menu-content-maxWidth);

  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
`;

Styled.Item = styled(Item)`
  ${popoverMixins.item}
`;

Styled.ItemIndicator = styled(ItemIndicator)`
  margin-left: auto;
  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);
`;

Styled.WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
  border-radius: 0;
`;

Styled.TriggerIcon = styled(Icon)`
  width: 0.625rem;
  height: 0.375rem;
  color: var(--color-text-0);
`;
