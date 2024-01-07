import { forwardRef } from 'react';
import styled, { css } from 'styled-components';
import BigNumber from 'bignumber.js';

import type { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { Row } from './OrderbookRow';

type StyleProps = {
  side?: 'top' | 'bottom';
};

type ElementProps = {
  spread: BigNumber | null;
  spreadPercent: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
};

export const SpreadRow = forwardRef<HTMLDivElement, StyleProps & ElementProps>(
  ({ side, spread, spreadPercent, tickSizeDecimals }, ref) => {
    const stringGetter = useStringGetter();

    return (
      <$SpreadRow ref={ref} side={side}>
        <span>
          <WithTooltip tooltip="spread">
            {stringGetter({ key: STRING_KEYS.ORDERBOOK_SPREAD })}
          </WithTooltip>
        </span>
        <span>
          <Output type={OutputType.Number} value={spread} fractionDigits={tickSizeDecimals} />
        </span>
        <span>
          <Output type={OutputType.Percent} value={spreadPercent} />
        </span>
      </$SpreadRow>
    );
  }
);

const $SpreadRow = styled(Row)<{ side?: 'top' | 'bottom' }>`
  height: 2rem;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);

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
