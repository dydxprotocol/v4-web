import styled from 'styled-components';

import type { Asset, MarketConfigs } from '@/constants/abacus';

import breakpoints from '@/styles/breakpoints';

import { AssetIcon } from '@/components/AssetIcon';
import { Tag } from '@/components/Tag';

import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { orEmptyObjType } from '@/lib/typeUtils';

import { Output, OutputType } from '../Output';
import { TableCell } from './TableCell';

interface AssetTableCellProps {
  asset?: Pick<Asset, 'name' | 'id'>;
  configs:
    | Pick<MarketConfigs, 'effectiveInitialMarginFraction' | 'initialMarginFraction'>
    | null
    | undefined;
  className?: string;
  stacked?: boolean;
}

export const AssetTableCell = (props: AssetTableCellProps) => {
  const { asset, stacked, configs, className } = props;
  const { initialMarginFraction, effectiveInitialMarginFraction } = orEmptyObjType(configs);

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
    <TableCell className={className} slotLeft={<$AssetIcon stacked={stacked} symbol={asset?.id} />}>
      <$TableCellContent stacked={stacked}>
        <$Asset stacked={stacked}>{asset?.name}</$Asset>
        {maxLeverage != null &&
          (stacked ? <$AssetID>{maxLeverage}</$AssetID> : <Tag>{maxLeverage}</Tag>)}
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

const $AssetID = styled.span`
  color: var(--color-text-0);
  font: var(--font-mini-medium);
`;

const $Asset = styled.span<{ stacked?: boolean }>`
  color: var(--color-text-1);
  font: ${({ stacked }) => (stacked ? 'var(--font-small-medium)' : 'var(--font-medium-medium)')};
`;
