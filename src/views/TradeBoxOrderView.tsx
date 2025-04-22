import { useCallback } from 'react';

import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { TradeTypes } from '@/constants/trade';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';

import { TradeSideTabs } from './TradeSideTabs';
import { TradeForm } from './forms/TradeForm';
import { MarginAndLeverageButtons } from './forms/TradeForm/MarginAndLeverageButtons';
import { useTradeTypeOptions } from './forms/TradeForm/useTradeTypeOptions';

export const TradeBoxOrderView = () => {
  const onTradeTypeChange = useCallback((tradeType?: TradeTypes) => {
    if (tradeType) {
      abacusStateManager.clearTradeInputValues();
      abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
    }
  }, []);

  const { selectedTradeType, tradeTypeItems } = useTradeTypeOptions();

  const onboardingState = useAppSelector(getOnboardingState);
  const allowChangingOrderType = onboardingState === OnboardingState.AccountConnected;

  return (
    <TradeSideTabs
      sharedContent={
        <div tw="flex min-h-full flex-col">
          <$MarginAndLeverageButtons />
          <$OrderTypeTabs
            value={selectedTradeType}
            items={tradeTypeItems}
            onValueChange={onTradeTypeChange}
            dividerStyle="underline"
            disabled={!allowChangingOrderType}
            sharedContent={
              <$Container>
                <TradeForm />
              </$Container>
            }
          />
        </div>
      }
    />
  );
};

const $Container = styled.div`
  ${layoutMixins.scrollArea}
`;

const $MarginAndLeverageButtons = styled(MarginAndLeverageButtons)`
  padding: 0 1rem;
  box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color);
`;

const $OrderTypeTabs = styled(Tabs)`
  --tabs-height: 2.125rem;
  --trigger-active-backgroundColor: var(--trigger-backgroundColor);

  > * > header > div {
    width: 100%;
    > button {
      width: 33%;
      padding: 0;
    }
  }
` as typeof Tabs;
