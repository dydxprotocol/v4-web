import styled, { type AnyStyledComponent } from 'styled-components';

import type { Asset } from '@/constants/abacus';

import { breakpoints } from '@/styles';

import { AssetIcon } from '@/components/AssetIcon';
import { TableCell } from '@/components/Table';
import { Tag } from '@/components/Tag';

interface AssetTableCellProps {
  asset?: Asset;
  className?: string;
  stacked?: boolean;
}

export const AssetTableCell = (props: AssetTableCellProps) => {
  const { asset, stacked, className } = props;

  return (
    <Styled.TableCell
      className={className}
      slotLeft={<Styled.AssetIcon stacked={stacked} symbol={asset?.id} />}
    >
      <Styled.TableCellContent stacked={stacked}>
        <Styled.Asset stacked={stacked}>{asset?.name}</Styled.Asset>
        {stacked ? <Styled.AssetID>{asset?.id}</Styled.AssetID> : <Tag>{asset?.id}</Tag>}
      </Styled.TableCellContent>
    </Styled.TableCell>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TableCell = styled(TableCell)`
  gap: 0.75rem;
`;

Styled.TableCellContent = styled.div<{ stacked?: boolean }>`
  gap: ${({ stacked }) => (stacked ? '0.125rem' : '0.75rem')};
  display: flex;
  flex-direction: ${({ stacked }) => (stacked ? 'column' : 'row')};
  align-items: ${({ stacked }) => (stacked ? 'flex-start' : 'center')};
`;

Styled.AssetIcon = styled(AssetIcon)<{ stacked?: boolean }>`
  font-size: ${({ stacked }) => (stacked ? '1.5rem' : '2rem')};

  @media ${breakpoints.tablet} {
    font-size: ${({ stacked }) => (stacked ? '1.5rem' : '2.25rem')};
  }
`;

Styled.AssetID = styled.span`
  color: var(--color-text-0);
  font: var(--font-mini-medium);
`;

Styled.Asset = styled.span<{ stacked?: boolean }>`
  color: var(--color-text-1);
  font: var(--font-medium-medium);
  line-height: ${({ stacked }) => (stacked ? '1' : undefined)};
`;
