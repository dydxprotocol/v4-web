import { useCallback } from 'react';

import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { TradeTypes } from '@/constants/trade';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

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

  return (
    <$TradeBoxOrderViewContainer>
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
        withBorders={false}
        // fullWidthTabs
        sharedContent={
          <$Container>
            <TradeForm />
          </$Container>
        }
      />
    </$TradeBoxOrderViewContainer>
  );
};

const $TradeBoxOrderViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  min-height: 100%;
`;

const $Container = styled.div`
  ${layoutMixins.scrollArea}
`;

const $Tabs = styled(Tabs)`
  overflow: hidden;
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
    width: 100%;
  }
`;

const $TopActionsRow = styled.div`
  display: grid;
  grid-auto-flow: column;

  padding-left: 1rem;
  padding-right: 1rem;
  @media ${breakpoints.tablet} {
    grid-auto-columns: var(--orderbox-column-width) 1fr;
    gap: var(--form-input-gap);
  }
`;
