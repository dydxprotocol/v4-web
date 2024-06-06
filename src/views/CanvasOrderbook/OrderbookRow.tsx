import { forwardRef } from 'react';

import { BigNumber } from 'bignumber.js';
import styled, { css } from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { ORDERBOOK_ROW_HEIGHT } from '@/constants/orderbook';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

type StyleProps = {
  side?: 'top' | 'bottom';
};

type ElementProps = {
  spread?: Nullable<BigNumber | number>;
  spreadPercent?: Nullable<number>;
  tickSizeDecimals?: Nullable<number>;
};

export const OrderbookRow = styled.div`
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
`;

export const SpreadRow = forwardRef<HTMLDivElement, StyleProps & ElementProps>(
  ({ side, spread, spreadPercent, tickSizeDecimals = TOKEN_DECIMALS }, ref) => {
    const stringGetter = useStringGetter();

    return (
      <$SpreadRow ref={ref} side={side}>
        <span>
          <WithTooltip tooltip="spread">
            {stringGetter({ key: STRING_KEYS.ORDERBOOK_SPREAD })}
          </WithTooltip>
        </span>
        <span>
          <Output type={OutputType.Fiat} value={spread} fractionDigits={tickSizeDecimals} />
        </span>
        <span>
          <Output type={OutputType.Percent} value={spreadPercent} />
        </span>
      </$SpreadRow>
    );
  }
);
const $SpreadRow = styled(OrderbookRow)<{ side?: 'top' | 'bottom' }>`
  height: 2rem;
  border-top: var(--border);
  border-bottom: var(--border);
  span {
    margin-bottom: 2px;
  }

  ${({ side }) =>
    side &&
    {
      top: css`
        border-top: none;
      `,
      bottom: css`
        border-bottom: none;
      `,
    }[side]}
`;
