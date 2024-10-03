import { useCallback } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { AbacusOrderSide, TradeInputField } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';
import { TradeTypes } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getTradeSide } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { getSelectedOrderSide } from '@/lib/tradeData';

import { TradeForm } from './forms/TradeForm';
import { MarginModeSelector } from './forms/TradeForm/MarginModeSelector';
import { TargetLeverageButton } from './forms/TradeForm/TargetLeverageButton';
import { useTradeTypeOptions } from './forms/TradeForm/useTradeTypeOptions';

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
    <div tw="flex min-h-full flex-col gap-0.25">
      <$MarginAndLeverageButtons>
        <MarginModeSelector openInTradeBox />
        <TargetLeverageButton />
      </$MarginAndLeverageButtons>
      <$OrderTypeTabs
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

  const items = [
    { value: OrderSide.BUY, label: stringGetter({ key: STRING_KEYS.BUY_LONG }) },
    { value: OrderSide.SELL, label: stringGetter({ key: STRING_KEYS.SELL_SHORT }) },
  ];
  return (
    <$TradeSideTabs
      fullWidthTabs
      dividerStyle="underline"
      activeTab={selectedOrderSide}
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
      disabled={!allowChangingOrderType}
      sharedContent={sharedContent}
    />
  );
};

const $Container = styled.div`
  ${layoutMixins.scrollArea}
`;

const tabsStyle = css`
  --trigger-active-underline-size: 2px;
  overflow: hidden;
  > header {
    justify-content: space-around;
  }
`;

const $OrderTypeTabs = styled(Tabs)`
  ${tabsStyle}
  --tabs-height: 2.125rem;
  --trigger-active-backgroundColor: var(--trigger-backgroundColor);
` as typeof Tabs;

const tradeSideTabsType = getSimpleStyledOutputType(Tabs, {} as { activeTab: OrderSide });

const $TradeSideTabs = styled(Tabs)<{ activeTab: OrderSide }>`
  ${tabsStyle}
  ${({ activeTab }) =>
    activeTab === OrderSide.BUY
      ? css`
          --trigger-active-underline-backgroundColor: var(--color-gradient-positive);
          --trigger-active-underlineColor: var(--color-positive);
          --trigger-active-textColor: var(--color-positive);
          --trigger-hover-textColor: var(--color-text-2);
        `
      : css`
          --trigger-active-underline-backgroundColor: var(--color-gradient-negative);
          --trigger-active-underlineColor: var(--color-negative);
          --trigger-active-textColor: var(--color-negative);
          --trigger-hover-textColor: var(--color-text-2);
        `};
` as typeof tradeSideTabsType;

const $MarginAndLeverageButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;

  border-bottom: var(--border);

  abbr,
  button {
    ${layoutMixins.flexExpandToSpace}
    height: 2.25rem;
    flex-basis: 100%;
  }
`;
