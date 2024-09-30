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

import { TradeForm } from './forms/TradeForm';
import { MarginModeSelector } from './forms/TradeForm/MarginModeSelector';
import { TargetLeverageButton } from './forms/TradeForm/TargetLeverageButton';
import { TradeSideToggle } from './forms/TradeForm/TradeSideToggle';
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
    <div tw="flex min-h-full flex-col gap-0.25 pt-0.875">
      <$TopActionsRow>
        <$MarginAndLeverageButtons>
          <MarginModeSelector openInTradeBox />
          <TargetLeverageButton />
        </$MarginAndLeverageButtons>
        <TradeSideToggle />
      </$TopActionsRow>
      <$Tabs
        key={selectedTradeType}
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
  );
};
const $Container = styled.div`
  ${layoutMixins.scrollArea}
`;

const $Tabs = styled(Tabs)`
  overflow: hidden;
  --tabs-height: 2.125rem;

  > header {
    justify-content: space-around;
  }
` as typeof Tabs;

const $TopActionsRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1rem;

  > * {
    ${layoutMixins.flexExpandToSpace}
  }
`;

const $MarginAndLeverageButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-right: 0.5rem;

  abbr,
  button {
    ${layoutMixins.flexExpandToSpace}
    height: 2.5rem;
  }
`;
