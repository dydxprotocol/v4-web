import { useCallback } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { STRING_KEYS, StringKey } from '@/constants/localization';
import { TradeTypes } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { TabItem, Tabs } from '@/components/Tabs';

import { getInputTradeData, getInputTradeOptions } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { isTruthy } from '@/lib/isTruthy';

import { TradeForm } from './forms/TradeForm';

const useTradeTypeOptions = (): {
  tradeTypeItems: TabItem<string>[];
  selectedTradeType: TradeTypes;
} => {
  const stringGetter = useStringGetter();
  const selectedTradeType = useSelector(
    createSelector(
      [getInputTradeData],
      (currentTradeData) => (currentTradeData?.type?.rawValue as TradeTypes) ?? TradeTypes.LIMIT
    )
  );
  const { typeOptions } = useSelector(getInputTradeOptions, shallowEqual) ?? {};
  const allTradeTypeItems = typeOptions?.toArray()?.map(({ type, stringKey }) => ({
    value: type,
    label: stringGetter({
      key:
        type === TradeTypes.TAKE_PROFIT ? STRING_KEYS.TAKE_PROFIT_LIMIT : (stringKey as StringKey),
    }),
  }));

  return {
    selectedTradeType,
    tradeTypeItems: allTradeTypeItems
      ? [
          allTradeTypeItems?.shift(), // Limit order is always first
          allTradeTypeItems?.shift(), // Market order is always second
          // All conditional orders labeled under "Stop Order"
          allTradeTypeItems?.length && {
            label: stringGetter({ key: STRING_KEYS.STOP_ORDER_SHORT }),
            value: '',
            subitems: allTradeTypeItems
              ?.map(
                ({ value, label }) =>
                  value != null && {
                    value: value,
                    label,
                  }
              )
              .filter(isTruthy),
          },
        ].filter(isTruthy)
      : [],
  };
};

export const TradeBoxOrderView = () => {
  const onTradeTypeChange = useCallback((tradeType?: string) => {
    if (tradeType) {
      abacusStateManager.clearTradeInputValues();
      abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
    }
  }, []);

  const { selectedTradeType, tradeTypeItems } = useTradeTypeOptions();

  return (
    <$Tabs
      key={selectedTradeType}
      value={selectedTradeType}
      items={tradeTypeItems}
      onValueChange={onTradeTypeChange}
      sharedContent={
        <$Container>
          <TradeForm />
        </$Container>
      }
      fullWidthTabs
    />
  );
};

const $Container = styled.div`
  ${layoutMixins.scrollArea}
`;

const $Tabs = styled(Tabs)`
  overflow: hidden;
` as typeof Tabs;
