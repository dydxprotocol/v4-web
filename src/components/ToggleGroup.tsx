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
};

type StyleProps = {
  className?: string;
  overflow?: 'scroll' | 'wrap';
  truncateLabel?: boolean;
  withSeparators?: boolean;
};

export const ToggleGroup = forwardRefFn(
  <MenuItemValue extends string>(
    {
      items,
      value,
      ensureSelected = true,
      onValueChange,
      onInteraction,

      className,
      overflow = 'scroll',
      truncateLabel = true,
      withSeparators = false,
      size,
      shape = ButtonShape.Pill,

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
          disabled={item.disabled}
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
      >
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
  --separatorHeight-padding: 0.5rem;
`;

const $ToggleButton = styled(ToggleButton)<{ $withSeparators: boolean }>`
  ${({ $withSeparators }) =>
    $withSeparators &&
    css`
      --button-toggle-on-border: none;
      --button-toggle-off-border: none;
      --button-toggle-off-backgroundColor: transparent;
      --button-toggle-on-backgroundColor: transparent;
      --button-padding: 0 0.25rem;

      width: min-content;
    `}
`;
