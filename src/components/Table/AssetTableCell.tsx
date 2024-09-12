import styled from 'styled-components';

import type { MarketConfigs, Nullable } from '@/constants/abacus';

import breakpoints from '@/styles/breakpoints';

import { AssetIcon } from '@/components/AssetIcon';
import { Tag } from '@/components/Tag';

import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { orEmptyRecord } from '@/lib/typeUtils';

import { Output, OutputType } from '../Output';
import { TableCell } from './TableCell';

interface AssetTableCellProps {
  symbol?: string;
  name?: Nullable<string>;
  configs:
    | Pick<MarketConfigs, 'effectiveInitialMarginFraction' | 'initialMarginFraction'>
    | null
    | undefined;
  className?: string;
  stacked?: boolean;
}

export const AssetTableCell = (props: AssetTableCellProps) => {
  const { symbol, name, stacked, configs, className } = props;
  const { initialMarginFraction, effectiveInitialMarginFraction } = orEmptyRecord(configs);

  const maxLeverage =
    configs != null ? (
      <Output
        type={OutputType.Multiple}
        value={calculateMarketMaxLeverage({
          effectiveInitialMarginFraction,
          initialMarginFraction,
        })}
        fractionDigits={0}
      />
    ) : undefined;
  return (
    <TableCell className={className} slotLeft={<$AssetIcon stacked={stacked} symbol={symbol} />}>
      <$TableCellContent stacked={stacked}>
        <div tw="row gap-0.5">
          <$Asset stacked={stacked}>{name}</$Asset>
          <Tag>{maxLeverage}</Tag>
        </div>
        {stacked ? <span tw="text-color-text-0 font-mini-medium">{symbol}</span> : undefined}
      </$TableCellContent>
    </TableCell>
  );
};

const $TableCellContent = styled.div<{ stacked?: boolean }>`
  gap: ${({ stacked }) => (stacked ? '0.125rem' : '0.75rem')};
  display: flex;
  flex-direction: ${({ stacked }) => (stacked ? 'column' : 'row')};
  align-items: ${({ stacked }) => (stacked ? 'flex-start' : 'center')};
`;
const $AssetIcon = styled(AssetIcon)<{ stacked?: boolean }>`
  font-size: ${({ stacked }) => (stacked ? '1.5rem' : '2rem')};

  @media ${breakpoints.tablet} {
    font-size: ${({ stacked }) => (stacked ? '1.5rem' : '2.25rem')};
  }
`;
const $Asset = styled.span<{ stacked?: boolean }>`
  color: var(--color-text-1);
  font: ${({ stacked }) => (stacked ? 'var(--font-small-medium)' : 'var(--font-medium-medium)')};
`;
