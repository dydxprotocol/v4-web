import { useCallback } from 'react';

import { TradeFormType } from '@/bonsai/forms/trade/types';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { TradeSideTabs } from './TradeSideTabs';
import { TradeForm } from './forms/TradeForm';
import { MarginAndLeverageButtons } from './forms/TradeForm/MarginAndLeverageButtons';
import { useTradeTypeOptions } from './forms/TradeForm/useTradeTypeOptions';

export const TradeBoxOrderView = () => {
  const dispatch = useAppDispatch();

  const onTradeTypeChange = useCallback(
    (tradeType?: TradeFormType) => {
      if (tradeType != null) {
        dispatch(tradeFormActions.setOrderType(tradeType));
      }
    },
    [dispatch]
  );

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
