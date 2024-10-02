import { useCallback } from 'react';

import styled from 'styled-components';

import { AbacusOrderSide, TradeInputField } from '@/constants/abacus';
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
import { getSelectedOrderSide } from '@/lib/tradeData';
import { getTradeSide } from '@/state/inputsSelectors';
import { shallowEqual } from 'react-redux';
import { useStringGetter } from '@/hooks/useStringGetter';
import { STRING_KEYS } from '@/constants/localization';
import { OrderSide } from '@dydxprotocol/v4-client-js';

export const TradeBoxOrderView = () => {
  const stringGetter = useStringGetter();
  const onTradeTypeChange = useCallback((tradeType?: TradeTypes) => {
    if (tradeType) {
      abacusStateManager.clearTradeInputValues();
      abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
    }
  }, []);

  const { selectedTradeType, tradeTypeItems } = useTradeTypeOptions();

  const onboardingState = useAppSelector(getOnboardingState);
  const allowChangingOrderType = onboardingState === OnboardingState.AccountConnected;

  const side = useAppSelector(getTradeSide, shallowEqual);
  const selectedOrderSide = getSelectedOrderSide(side);

  const sharedContent = (
    <div tw="flex min-h-full flex-col gap-0.25 pt-0.875">
      <$TopActionsRow>
        <$MarginAndLeverageButtons>
          <MarginModeSelector openInTradeBox />
          <TargetLeverageButton />
        </$MarginAndLeverageButtons>
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

  const items = [
    { value: OrderSide.BUY, label: stringGetter({ key: STRING_KEYS.BUY }) },
    { value: OrderSide.SELL, label: stringGetter({ key: STRING_KEYS.SELL }) },
];
  return (
    <$Tabs
      key={selectedOrderSide}
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
      withBorders={false}
      disabled={!allowChangingOrderType}
      sharedContent={sharedContent}
      withUnderline
    />
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

const $TopActionsRow = styled.div`
  display: flex;
  flex-direction: column;
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
