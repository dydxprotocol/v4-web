import { useImperativeHandle, useRef, type Ref } from 'react';

import { Item, Root } from '@radix-ui/react-toggle-group';
import styled, { css } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { type MenuItem } from '@/constants/menus';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import { layoutMixins } from '@/styles/layoutMixins';

import { type BaseButtonProps } from '@/components/BaseButton';
import { ToggleButton } from '@/components/ToggleButton';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

import { WithSeparators } from './Separator';

type ElementProps<MenuItemValue extends string> = {
  items: MenuItem<MenuItemValue>[];
  value: MenuItemValue;
  onValueChange: (value: MenuItemValue) => void;
  onInteraction?: () => void;
  ensureSelected?: boolean;
  disabled?: boolean;
};

type StyleProps = {
  className?: string;
  overflow?: 'scroll' | 'wrap';
  slotBefore?: React.ReactNode;
  truncateLabel?: boolean;
  withSeparators?: boolean;
};

export const ToggleGroup = forwardRefFn(
  <MenuItemValue extends string>(
    {
      items,
      value,
      ensureSelected = true,
      disabled = false,
      onValueChange,
      onInteraction,

      className,
      overflow = 'scroll',
      truncateLabel = true,
      withSeparators = false,
      size,
      shape = ButtonShape.Pill,
      slotBefore,

      ...buttonProps
    }: ElementProps<MenuItemValue> & StyleProps & BaseButtonProps,
    ref: Ref<HTMLDivElement>
  ) => {
    const { isTablet } = useBreakpoints();

    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current!, []);

    // TODO: re-enable CT-1296
    // const { showFadeStart, showFadeEnd } = useFadeOnHorizontalScrollContainer({
    //   scrollRef: innerRef,
    // });

    const toggleItems = items.map((item) => (
      <Item key={item.value} value={item.value} disabled={item.disabled} asChild>
        <$ToggleButton
          size={size ?? (isTablet ? ButtonSize.Small : ButtonSize.XSmall)}
          shape={shape}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          disabled={item.disabled || disabled}
          $withSeparators={withSeparators}
          {...buttonProps}
        >
          {item.slotBefore}
          {truncateLabel ? <$Label>{item.label}</$Label> : item.label}
          {item.slotAfter}
        </$ToggleButton>
      </Item>
    ));

    return (
      <$Root
        ref={innerRef}
        type="single"
        value={value}
        onValueChange={(newValue: MenuItemValue) => {
          if ((ensureSelected && newValue) || !ensureSelected) {
            onValueChange(newValue);
          }
          onInteraction?.();
        }}
        className={className}
        loop
        overflow={overflow}
        tw="row gap-[0.33em]"
        $withSeparators={withSeparators}
        disabled={disabled}
      >
        {slotBefore}
        {withSeparators ? (
          <$WithSeparators layout="row" withSeparators>
            {toggleItems}
          </$WithSeparators>
        ) : (
          toggleItems
        )}
      </$Root>
    );
  }
);

const $Root = styled(Root)<{
  overflow: 'scroll' | 'wrap';
  $withSeparators: boolean;
}>`
  ${({ $withSeparators }) =>
    $withSeparators &&
    css`
      --separator-padding: 0.5rem;
      align-self: stretch;
    `}
  ${({ overflow }) =>
    ({
      scroll: css`
        overflow-x: auto;
      `,
      wrap: css`
        display: flex;
        flex-wrap: wrap;
      `,
    })[overflow]}
`;

const $Label = styled.div`
  ${layoutMixins.textTruncate}
`;

const $WithSeparators = styled(WithSeparators)`
  --separatorHeight-padding: var(--separator-padding);
`;

const $ToggleButton = styled(ToggleButton)<{ $withSeparators: boolean }>`
  &[data-disabled] {
    > * {
      cursor: not-allowed;
    }
  }
  &:not([data-disabled]) {
    > * {
      cursor: pointer;
    }
  }

  ${({ $withSeparators }) =>
    $withSeparators &&
    css`
      --button-toggle-on-border: none;
      --button-toggle-off-border: none;
      --button-toggle-off-backgroundColor: transparent;
      --button-toggle-on-backgroundColor: transparent;
      --button-padding: 0 0.25rem;

      width: min-content;
      max-width: max-content;
    `}
`;
