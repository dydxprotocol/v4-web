import React from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';
import { ColorToken } from '@/constants/styles/base';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';
import { MarginModeSelector } from '@/views/forms/TradeForm/MarginModeSelector';

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
    <$Container className={className}>
      <$HeaderSection>
        <MarginModeSelector />
        <$TradeSideTabs
          fullWidthTabs
          dividerStyle="none"
          activeTab={side}
          value={side}
          items={items}
          onValueChange={(newSide: OrderSide) => {
            dispatch(tradeFormActions.setSide(newSide));
          }}
          disabled={!allowChangingOrderType}
          sharedContent={sharedContent}
        />
      </$HeaderSection>
    </$Container>
  );
};

const tradeSideTabsType = getSimpleStyledOutputType(Tabs, {} as { activeTab: OrderSide });

const $Container = styled.div`
  border-top-right-radius: 0.75rem;
  border-top-left-radius: 0.75rem;
  overflow: visible;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const $HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--color-layer-1);
  border-top-right-radius: 0.75rem;
  border-top-left-radius: 0.75rem;
  flex: 1;
  min-height: 0;
`;

const $TradeSideTabs = styled(Tabs)<{ activeTab: OrderSide }>`
  --tabs-height: 2.625rem;
  overflow: visible;
  padding: 0;
  gap: 0.5rem;

  /* Base styles for all tabs */
  --trigger-backgroundColor: #12121280; /* #121212 at 50% opacity */
  --trigger-textColor: var(--color-text-2);
  --trigger-active-backgroundColor: ${ColorToken.Orange0};
  --trigger-active-textColor: ${ColorToken.White};
  --trigger-hover-textColor: var(--color-text-0);
  --trigger-hover-backgroundColor: #12121280;
  --trigger-active-underline-size: 0px;
  --trigger-underline-size: 0px;
  --trigger-border-radius: 9999px; /* Pill shape */

  /* Remove underline styles */
  --trigger-active-underline-backgroundColor: transparent;
  --trigger-active-underlineColor: transparent;

  /* Style the tab list container */
  > div > header {
    gap: 0.5rem;
    padding: 0;
    background-color: transparent;
  }

  /* Style the list container */
  > div > header > ul[role='tablist'] {
    gap: 0.5rem;
  }

  /* Style individual tab triggers as pills - target buttons in header of first div only */
  /* Use multiple selector patterns to ensure we match */
  > div:first-child header button[role='tab'],
  > div:first-child > header button[role='tab'],
  header:first-of-type button[role='tab'] {
    border-radius: 9999px !important; /* Fully rounded for pill shape */
    background-color: transparent !important;
    color: var(--trigger-textColor) !important;
    opacity: 0.5 !important; /* 50% opacity for unselected tabs */
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      opacity 0.2s ease !important;
    box-shadow: none !important; /* Remove any underline box-shadow */

    &[data-state='active'] {
      background-color: var(--trigger-active-backgroundColor) !important;
      color: var(--trigger-active-textColor) !important;
      opacity: 1 !important; /* Full opacity for selected tab */
    }

    &:hover:not([data-state='active']) {
      background-color: transparent !important;
      color: var(--trigger-hover-textColor) !important;
      opacity: 0.5 !important; /* Keep 50% opacity on hover for unselected */
    }
  }
` as typeof tradeSideTabsType;
