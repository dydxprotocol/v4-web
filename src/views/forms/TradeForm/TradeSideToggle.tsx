import { memo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import { AbacusOrderSide, TradeInputField } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { ToggleGroup } from '@/components/ToggleGroup';

import { getTradeSide } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { getSelectedOrderSide } from '@/lib/tradeData';

export const TradeSideToggle = memo(() => {
  const stringGetter = useStringGetter();
  const side = useSelector(getTradeSide, shallowEqual);
  const selectedOrderSide = getSelectedOrderSide(side);

  return (
    <$ToggleContainer
      items={[
        { value: OrderSide.BUY, label: stringGetter({ key: STRING_KEYS.BUY }) },
        { value: OrderSide.SELL, label: stringGetter({ key: STRING_KEYS.SELL }) },
      ]}
      value={selectedOrderSide}
      onValueChange={(side: OrderSide) => {
        abacusStateManager.setTradeValue({
          value:
            side === OrderSide.BUY ? AbacusOrderSide.buy.rawValue : AbacusOrderSide.sell.rawValue,
          field: TradeInputField.side,
        });
      }}
      size={ButtonSize.Base}
      shape={ButtonShape.Rectangle}
    />
  );
});

type ToggleContainerStyleProps = { value: OrderSide };
const toggleContainerType = getSimpleStyledOutputType(ToggleGroup, {} as ToggleContainerStyleProps);
const $ToggleContainer = styled(ToggleGroup)<ToggleContainerStyleProps>`
  --toggle-radius: 0.5em;
  --toggle-color: var(--color-negative);
  --toggle-background: ${({ theme }) => theme.toggleBackground};

  ${({ value }) =>
    value === OrderSide.BUY &&
    css`
      --toggle-color: var(--color-positive);
    `}

  border-radius: var(--toggle-radius);
  background-color: var(--toggle-background);
  position: relative;

  > button {
    --button-toggle-on-border: none;
    --button-toggle-off-border: none;
    --button-toggle-off-backgroundColor: transparent;
    --button-toggle-on-backgroundColor: transparent;
    --button-toggle-on-textColor: var(--toggle-color);

    flex: 1;
    z-index: 1;
    outline: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background-color: var(--color-layer-2);
    border-radius: var(--toggle-radius);
    transition: 0.2s ease-in-out;
    box-shadow: inset 0 0 0 1px var(--toggle-color);

    ${({ value }) =>
      value === OrderSide.SELL &&
      css`
        transform: translateX(100%);
      `}
  }
` as typeof toggleContainerType;
