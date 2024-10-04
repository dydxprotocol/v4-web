import React from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { AbacusOrderSide, TradeInputField } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTradeSide } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { getSelectedOrderSide } from '@/lib/tradeData';

type ElementProps = {
  sharedContent: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

export const TradeSideTabs = ({ sharedContent, className }: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const onboardingState = useAppSelector(getOnboardingState);
  const allowChangingOrderType = onboardingState === OnboardingState.AccountConnected;

  const side = useAppSelector(getTradeSide, shallowEqual);
  const selectedOrderSide = getSelectedOrderSide(side);

  const items = [
    { value: OrderSide.BUY, label: stringGetter({ key: STRING_KEYS.BUY_LONG }) },
    { value: OrderSide.SELL, label: stringGetter({ key: STRING_KEYS.SELL_SHORT }) },
  ];

  return (
    <$TradeSideTabs
      className={className}
      fullWidthTabs
      dividerStyle="underline"
      activeTab={selectedOrderSide}
      value={selectedOrderSide}
      items={items}
      onValueChange={(newSide: OrderSide) => {
        abacusStateManager.setTradeValue({
          value:
            newSide === OrderSide.BUY
              ? AbacusOrderSide.Buy.rawValue
              : AbacusOrderSide.Sell.rawValue,
          field: TradeInputField.side,
        });
      }}
      disabled={!allowChangingOrderType}
      sharedContent={sharedContent}
    />
  );
};

const tradeSideTabsType = getSimpleStyledOutputType(Tabs, {} as { activeTab: OrderSide });

const $TradeSideTabs = styled(Tabs)<{ activeTab: OrderSide }>`
  ${({ activeTab }) =>
    activeTab === OrderSide.BUY
      ? css`
          --trigger-active-underline-backgroundColor: var(--color-positive-dark);
          --trigger-active-underlineColor: var(--color-positive);
          --trigger-active-textColor: var(--color-positive);
          --trigger-hover-textColor: var(--color-text-2);
        `
      : css`
          --trigger-active-underline-backgroundColor: var(--color-negative-dark);
          --trigger-active-underlineColor: var(--color-negative);
          --trigger-active-textColor: var(--color-negative);
          --trigger-hover-textColor: var(--color-text-2);
        `};
` as typeof tradeSideTabsType;
