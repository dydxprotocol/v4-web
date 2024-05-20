import styled from 'styled-components';

import type { Asset } from '@/constants/abacus';

import { breakpoints } from '@/styles';

import { AssetIcon } from '@/components/AssetIcon';
import { Tag } from '@/components/Tag';

import { TableCell } from './TableCell';

interface AssetTableCellProps {
  asset?: Asset;
  className?: string;
  stacked?: boolean;
}

export const AssetTableCell = (props: AssetTableCellProps) => {
  const { asset, stacked, className } = props;

  return (
    <TableCell className={className} slotLeft={<$AssetIcon stacked={stacked} symbol={asset?.id} />}>
      <$TableCellContent stacked={stacked}>
        <$Asset stacked={stacked}>{asset?.name}</$Asset>
        {stacked ? <$AssetID>{asset?.id}</$AssetID> : <Tag>{asset?.id}</Tag>}
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
