import styled, { type AnyStyledComponent } from 'styled-components';

import type { Asset } from '@/constants/abacus';

import { breakpoints } from '@/styles';

import { AssetIcon } from '@/components/AssetIcon';
import { TableCell } from '@/components/Table';
import { Tag } from '@/components/Tag';

export const AssetTableCell = ({ asset, className }: { asset?: Asset; className?: string }) => (
  <Styled.TableCell
    className={className}
    stacked
    slotLeft={<Styled.AssetIcon symbol={asset?.id} />}
  >
    <Styled.TableCellContent>
      <Styled.Asset>{asset?.name}</Styled.Asset>
      <Tag>{asset?.id}</Tag>
    </Styled.TableCellContent>
  </Styled.TableCell>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TableCell = styled(TableCell)`
  gap: 0.75rem;
`;

Styled.TableCellContent = styled.div`
  gap: 0.75rem;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

Styled.AssetIcon = styled(AssetIcon)`
  font-size: 2rem;

  @media ${breakpoints.tablet} {
    font-size: 2.25rem;
  }
`;

Styled.Asset = styled.span`
  color: var(--color-text-1);
  font: var(--font-medium-medium);
`;
