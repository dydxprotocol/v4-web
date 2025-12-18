import { useCallback } from 'react';

import { TradeFormType } from '@/bonsai/forms/trade/types';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ColorToken } from '@/constants/styles/base';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { TradeSideTabs } from './TradeSideTabs';
import { TradeForm } from './forms/TradeForm';
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
    <div tw="flex h-full flex-col gap-0">
      <TradeSideTabs
        sharedContent={
          <div tw="flex min-h-0 flex-1 flex-col">
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
    </div>
  );
};

const $Container = styled.div`
  ${layoutMixins.scrollArea}
  background-color: var(--color-layer-1);
`;

const $OrderTypeTabs = styled(Tabs)`
  --trigger-backgroundColor: var(--color-layer-1);
  --tabs-height: 2.625rem;
  --tabs-padding: 0.1rem;
  --trigger-paddingX: 1rem;
  --trigger-active-backgroundColor: var(--trigger-backgroundColor);
  --trigger-active-underlineColor: ${ColorToken.Orange0};
  --trigger-active-textColor: ${ColorToken.Orange0};
  --trigger-active-underline-size: 2px;
  --trigger-underline-size: 0px;
  --trigger-active-underline-backgroundColor: transparent;
  background-color: var(--color-layer-1);
  flex: 1;
  min-height: 0;
  align-self: center;
  width: 100%;

  /* Target the list container - use high specificity to override parent styles */
  > div > header > div[role='tablist'] {
    width: auto;

    > button[role='tab'] {
      width: fit-content;

      /* &[data-state='active'] {
        box-shadow: inset 0 -2px 0 ${ColorToken.Orange0} !important;
        color: ${ColorToken.Orange0} !important;
      } */
    }
  }

  /* Ensure underline shows - override any inherited box-shadow: none */
  button[role='tab'][data-state='active'] {
    box-shadow: inset 0 -2px 0 ${ColorToken.Orange0} !important;
  }
` as typeof Tabs;
