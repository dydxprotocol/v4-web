import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { TradeInputField } from '@/constants/abacus';
import { TradeTypes, TRADE_TYPE_STRINGS } from '@/constants/trade';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';

import { getInputTradeData } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSelectedTradeType } from '@/lib/tradeData';

import { TradeForm } from './forms/TradeForm';

export const TradeBoxOrderView = () => {
  const stringGetter = useStringGetter();
  const currentTradeData = useSelector(getInputTradeData, shallowEqual);
  const { type } = currentTradeData || {};
  const selectedTradeType = getSelectedTradeType(type);

  const onTradeTypeChange = (tradeType?: TradeTypes) => {
    if (tradeType) {
      abacusStateManager.clearTradeInputValues();
      abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
    }
  };

  const tradeTypeItems = [
    {
      value: TradeTypes.LIMIT,
      label: stringGetter({ key: TRADE_TYPE_STRINGS[TradeTypes.LIMIT].tradeTypeKeyShort }),
    },
    {
      value: TradeTypes.MARKET,
      label: stringGetter({ key: TRADE_TYPE_STRINGS[TradeTypes.MARKET].tradeTypeKeyShort }),
    },
    {
      label: stringGetter({ key: STRING_KEYS.STOP_ORDER_SHORT }),
      subitems: [
        TradeTypes.STOP_LIMIT,
        TradeTypes.STOP_MARKET,
        TradeTypes.TRAILING_STOP,
        TradeTypes.TAKE_PROFIT_LIMIT,
        TradeTypes.TAKE_PROFIT_MARKET,
      ].map((tradeType) => ({
        value: tradeType,
        label: stringGetter({ key: TRADE_TYPE_STRINGS[tradeType].tradeTypeKeyShort }),
        disabled: true,
      })),
    },
  ];

  return (
    <Styled.Tabs
      key={selectedTradeType}
      value={selectedTradeType}
      items={tradeTypeItems}
      onValueChange={onTradeTypeChange}
      sharedContent={
        <Styled.Container>
          <TradeForm />
        </Styled.Container>
      }
      fullWidthTabs
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  ${layoutMixins.scrollArea}
`;

Styled.Tabs = styled(Tabs)`
  overflow: hidden;
`;
