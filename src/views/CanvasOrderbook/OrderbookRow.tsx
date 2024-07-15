import { forwardRef } from 'react';

import styled, { css } from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { ORDERBOOK_ROW_HEIGHT } from '@/constants/orderbook';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketMidMarketPriceWithOraclePriceFallback } from '@/state/perpetualsSelectors';

type StyleProps = {
  side?: 'top' | 'bottom';
  isHeader?: boolean;
};

type ElementProps = {
  tickSizeDecimals?: Nullable<number>;
};

export const OrderbookRow = styled.div<{ isHeader?: boolean }>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: ${ORDERBOOK_ROW_HEIGHT}px;
  min-height: ${ORDERBOOK_ROW_HEIGHT}px;
  position: relative;
  padding-right: 0.5rem;
  font: var(--font-mini-book);

  > span {
    flex: 1 1 0%;
    text-align: right;
  }

  ${({ isHeader }) =>
    isHeader
      ? `
  padding-left: 2rem;
  gap: 2rem;
  > span {
    flex: 0 0 0%;
  }
  `
      : ``}
`;

export const OrderbookMiddleRow = forwardRef<HTMLDivElement, StyleProps & ElementProps>(
  ({ side, isHeader, tickSizeDecimals = TOKEN_DECIMALS }, ref) => {
    const stringGetter = useStringGetter();
    const orderbookMidMarketPrice = useAppSelector(
      getCurrentMarketMidMarketPriceWithOraclePriceFallback
    );

    return (
      <$OrderbookMiddleRow ref={ref} side={side} isHeader={isHeader}>
        <span>{stringGetter({ key: STRING_KEYS.PRICE })}</span>
        <$PriceOutputSpan>
          <$Output
            type={OutputType.Number}
            value={orderbookMidMarketPrice}
            fractionDigits={tickSizeDecimals}
          />
        </$PriceOutputSpan>
        <span /> {/* Empty cell */}
      </$OrderbookMiddleRow>
    );
  }
);
const $OrderbookMiddleRow = styled(OrderbookRow)<{ side?: 'top' | 'bottom' }>`
  height: 1.75rem;
  border-top: var(--border);
  border-bottom: var(--border);

  ${({ side }) =>
    side &&
    {
      top: css`
        border-top: none;
      `,
      bottom: css`
        border-bottom: none;
      `,
    }[side]};
`;

// matching the output height and styling with price span
const $PriceOutputSpan = styled.span`
  display: flex;
  flex-direction: column;
`;

const $Output = styled(Output)`
  justify-content: right;
`;
