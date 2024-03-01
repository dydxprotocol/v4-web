import { useState } from 'react';

import { useSelector, shallowEqual } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

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

  const { side, type, summary } = currentTradeData || {};
  const { total } = summary || {};
  const selectedTradeType = getSelectedTradeType(type);
  const selectedOrderSide = getSelectedOrderSide(side);

  const hasSummary = !!total;

  return (
    <TradeDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      slotTrigger={
        <Styled.TradeDialogTrigger hasSummary={hasSummary}>
          {hasSummary ? (
            <Styled.TradeSummary>
              <Styled.TradeType>
                <span>
                  {stringGetter({ key: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey })}
                </span>
                <OrderSideTag size={TagSize.Medium} orderSide={selectedOrderSide} />
              </Styled.TradeType>
              <Styled.Output
                type={OutputType.Fiat}
                value={total}
                showSign={ShowSign.None}
                useGrouping
              />
            </Styled.TradeSummary>
          ) : (
            stringGetter({ key: STRING_KEYS.TAP_TO_TRADE })
          )}
          <Styled.Icon iconName={IconName.Caret} />
        </Styled.TradeDialogTrigger>
      }
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TradeDialogTrigger = styled.div<{ hasSummary?: boolean }>`
  ${layoutMixins.stickyFooter}

  ${layoutMixins.spacedRow}

  height: ${({ hasSummary }) => (hasSummary ? '6.5rem' : 'var(--page-currentFooterHeight)')};

  padding: 0 1.5rem;

  font: var(--font-medium-book);
  color: var(--color-text-0);

  cursor: pointer;
`;

Styled.TradeSummary = styled.div`
  ${layoutMixins.rowColumn}
  font: var(--font-medium-book);
`;

Styled.TradeType = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.Output = styled(Output)`
  color: var(--color-text-2);
  font: var(--font-large-book);
`;

Styled.Icon = styled(Icon)`
  rotate: 0.5turn;
  width: 1.5rem;
  height: 1.5rem;
`;
