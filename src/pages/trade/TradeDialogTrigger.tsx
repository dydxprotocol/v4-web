import { useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TagSize } from '@/components/Tag';
import { TradeDialog } from '@/views/dialogs/TradeDialog';

import { getInputTradeData } from '@/state/inputsSelectors';

import { getSelectedOrderSide, getSelectedTradeType } from '@/lib/tradeData';

export const TradeDialogTrigger = () => {
  const stringGetter = useStringGetter();

  const [isOpen, setIsOpen] = useState(false);

  const currentTradeData = useSelector(getInputTradeData, shallowEqual);

  const { side, type, summary } = currentTradeData ?? {};
  const { total } = summary ?? {};
  const selectedTradeType = getSelectedTradeType(type);
  const selectedOrderSide = getSelectedOrderSide(side);

  const hasSummary = !!total;

  return (
    <TradeDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      slotTrigger={
        <$TradeDialogTrigger hasSummary={hasSummary}>
          {hasSummary ? (
            <$TradeSummary>
              <$TradeType>
                <span>
                  {stringGetter({ key: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey })}
                </span>
                <OrderSideTag size={TagSize.Medium} orderSide={selectedOrderSide} />
              </$TradeType>
              <$Output type={OutputType.Fiat} value={total} showSign={ShowSign.None} useGrouping />
            </$TradeSummary>
          ) : (
            stringGetter({ key: STRING_KEYS.TAP_TO_TRADE })
          )}
          <$Icon iconName={IconName.Caret} />
        </$TradeDialogTrigger>
      }
    />
  );
};
const $TradeDialogTrigger = styled.div<{ hasSummary?: boolean }>`
  ${layoutMixins.stickyFooter}

  ${layoutMixins.spacedRow}

  height: ${({ hasSummary }) => (hasSummary ? '6.5rem' : 'var(--page-currentFooterHeight)')};

  padding: 0 1.5rem;

  font: var(--font-medium-book);
  color: var(--color-text-0);

  cursor: pointer;
`;

const $TradeSummary = styled.div`
  ${layoutMixins.rowColumn}
  font: var(--font-medium-book);
`;

const $TradeType = styled.div`
  ${layoutMixins.inlineRow}
`;

const $Output = styled(Output)`
  color: var(--color-text-2);
  font: var(--font-large-book);
`;

const $Icon = styled(Icon)`
  rotate: 0.5turn;
  width: 1.5rem;
  height: 1.5rem;
`;
