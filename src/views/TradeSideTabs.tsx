import React from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import styled, { css } from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';

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

  const side = useAppSelector(getTradeFormValues).side ?? OrderSide.BUY;
  const dispatch = useAppDispatch();

  const items = [
    { value: OrderSide.BUY, label: stringGetter({ key: STRING_KEYS.BUY_LONG }) },
    { value: OrderSide.SELL, label: stringGetter({ key: STRING_KEYS.SELL_SHORT }) },
  ];

  return (
    <$TradeSideTabs
      className={className}
      fullWidthTabs
      dividerStyle="underline"
      activeTab={side}
      value={side}
      items={items}
      onValueChange={(newSide: OrderSide) => {
        dispatch(tradeFormActions.setSide(newSide));
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
