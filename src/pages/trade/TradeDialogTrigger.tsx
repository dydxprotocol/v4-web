import { useState } from 'react';

import { OrderSide } from '@/bonsai/forms/trade/types';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TagSize } from '@/components/Tag';
import { TradeDialog } from '@/views/dialogs/TradeDialog';

import { useAppSelector } from '@/state/appTypes';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

export const TradeDialogTrigger = () => {
  const stringGetter = useStringGetter();

  const [isOpen, setIsOpen] = useState(false);

  const currentTradeSummary = useAppSelector(getTradeFormSummary);
  const currentTrade = useAppSelector(getTradeFormValues);

  const total = currentTradeSummary.summary.tradeInfo.total;
  const selectedTradeType = currentTrade.type;
  const selectedOrderSide = currentTrade.side ?? OrderSide.BUY;

  const hasSummary = total != null && total !== 0;

  return (
    <TradeDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      slotTrigger={
        <$TradeDialogTrigger hasSummary={hasSummary}>
          {hasSummary ? (
            <$TradeSummary>
              <div tw="inlineRow">
                <span>
                  {stringGetter({ key: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey })}
                </span>
                <OrderSideTag size={TagSize.Medium} orderSide={selectedOrderSide} />
              </div>
              <Output
                type={OutputType.Fiat}
                value={total}
                showSign={ShowSign.None}
                useGrouping
                tw="text-color-text-2 font-large-book"
              />
            </$TradeSummary>
          ) : (
            stringGetter({ key: STRING_KEYS.TAP_TO_TRADE })
          )}
          <Icon iconName={IconName.Caret} size="1.5rem" tw="[rotate:0.5turn]" />
        </$TradeDialogTrigger>
      }
    />
  );
};
const $TradeDialogTrigger = styled.div<{ hasSummary?: boolean }>`
  ${layoutMixins.stickyFooter}
  background-color: var(--color-layer-2);

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
