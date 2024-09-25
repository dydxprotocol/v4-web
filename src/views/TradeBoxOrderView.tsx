import { useCallback } from 'react';

import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { TradeTypes } from '@/constants/trade';

import breakpoints from '@/styles/breakpoints';
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
          <$MarginModeSelector openInTradeBox />
          <TargetLeverageButton />
        </$MarginAndLeverageButtons>
        <$TradeSideToggle />
      </$TopActionsRow>
      <$Tabs
        key={selectedTradeType}
        value={selectedTradeType}
        items={tradeTypeItems}
        onValueChange={onTradeTypeChange}
        withBorders={false}
        disabled={!allowChangingOrderType}
        sharedContent={
          <$Container>
            <TradeForm />
          </$Container>
        }
        withUnderline
      />
    </div>
  );
};
const $Container = styled.div`
  ${layoutMixins.scrollArea}
  border-top: var(--border-width) solid var(--border-color);
`;

const $Tabs = styled(Tabs)`
  overflow: hidden;
  --tabs-height: 2.125rem;
  --trigger-active-backgroundColor: --trigger-backgroundColor;
  --trigger-active-underline-size: 2px;

  > header {
    justify-content: space-around;
  }
` as typeof Tabs;

const $MarginAndLeverageButtons = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.5rem;
  margin-right: 0.5rem;

  abbr,
  button {
    // width: 100%;
    height: 2.5rem;
    flex: 1;
    min-width: 1px;
  }
`;

const $TradeSideToggle = styled(TradeSideToggle)``;

const $TopActionsRow = styled.div`
  display: flex;
  // display: grid;
  // grid-auto-flow: column;

  padding-left: 1rem;
  padding-right: 1rem;

  > * {
    min-width: 1px;
    flex: 1 1 1px;
  }

  @media ${breakpoints.tablet} {
    grid-auto-columns: var(--orderbox-column-width) 1fr;
    gap: var(--form-input-gap);
  }
`;

const $MarginModeSelector = styled(MarginModeSelector)``;
