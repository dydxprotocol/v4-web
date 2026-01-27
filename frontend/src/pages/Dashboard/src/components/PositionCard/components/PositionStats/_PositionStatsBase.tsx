import type { FC } from 'react';
import * as $ from './_PositionStatsBase.css';

export interface _PositionStatsBaseProps {
  label: string;
  value: string | null;
  /** Symbol to display before the value (default: '$') */
  prefix?: string;
  /** Symbol to display after the value */
  suffix?: string;
  secondaryValue?: string;
}

export const _PositionStatsBase: FC<_PositionStatsBaseProps> = ({
  label,
  value,
  prefix = '$',
  suffix,
  secondaryValue,
}) => (
  <div css={$.statCell}>
    <span css={$.statLabel}>{label}</span>
    <span css={[$.statValue, value == null && $.statValueMuted]}>
      {value != null ? `${prefix}${value}${suffix ? ` ${suffix}` : ''}` : '—'}
    </span>
    {secondaryValue && <span css={$.statValueSecondary}>{secondaryValue}</span>}
  </div>
);
