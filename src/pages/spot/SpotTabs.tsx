import React, { ReactNode } from 'react';

import { Content, List, Root, Trigger } from '@radix-ui/react-tabs';
import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

export enum SpotTabVariant {
  Buy = 'Buy',
  Sell = 'Sell',
}

export type SpotTabItem = {
  value: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
  variant?: SpotTabVariant;
};

export type SpotTabsProps = {
  items: SpotTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  sharedContent?: React.ReactNode;
  disabled?: boolean;
};

export const SpotTabs = ({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  sharedContent,
  disabled,
}: SpotTabsProps) => {
  const fallbackValue = items.find((i) => !i.disabled)?.value;

  return (
    <$Root
      value={value}
      defaultValue={defaultValue ?? fallbackValue}
      onValueChange={onValueChange}
      className={className}
    >
      <$List>
        {items.map((item) => (
          <$Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled ?? disabled}
            $variant={item.variant ?? SpotTabVariant.Buy}
          >
            {item.label}
          </$Trigger>
        ))}
      </$List>
      {sharedContent ??
        items.map((item) => (
          <$Content key={item.value} value={item.value}>
            {item.content}
          </$Content>
        ))}
    </$Root>
  );
};

const $Root = styled(Root)`
  --tab-border-radius: 10px;
  gap: 1rem;

  ${layoutMixins.contentContainer}
  ${layoutMixins.scrollArea}
`;

const $List = styled(List)`
  display: flex;
  flex-direction: row;
  padding: 0.125rem;
  background-color: var(--color-layer-1);
  border-radius: var(--tab-border-radius);
  gap: 0.125rem;
`;

const spotTabVariants: Record<SpotTabVariant, ReturnType<typeof css>> = {
  [SpotTabVariant.Buy]: css`
    --tab-textColor: var(--color-green);
    --tab-backgroundColor: var(--color-green-faded);
  `,

  [SpotTabVariant.Sell]: css`
    --tab-textColor: var(--color-red);
    --tab-backgroundColor: var(--color-red-faded);
  `,
};

const $Trigger = styled(Trigger)<{
  $variant: SpotTabVariant;
}>`
  --tab-textColor: var(--color-text-0);
  --tab-backgroundColor: var(--color-layer-1);
  --tab-hover-backgroundColor: var(--color-layer-4);
  --tab-hover-filter: brightness(var(--hover-filter-variant));

  ${layoutMixins.textTruncate}

  &[data-state='active'] {
    ${({ $variant }) => spotTabVariants[$variant]}
  }

  &:disabled {
    opacity: 0.5;
  }

  &:hover:not(:disabled) {
    filter: var(--tab-hover-filter);
  }

  background-color: var(--tab-backgroundColor);
  color: var(--tab-textColor);
  cursor: pointer;
  font-size: var(--fontSize-base);
  font-weight: 500;
  flex: 1;
  height: 2.25rem;
  border-radius: calc(var(--tab-border-radius) - 0.125rem);
  padding: 0 1rem;
  text-align: center;
`;

const $Content = styled(Content)`
  ${layoutMixins.flexColumn}
  flex: 1;

  &[data-state='inactive'] {
    display: none;
  }
`;
