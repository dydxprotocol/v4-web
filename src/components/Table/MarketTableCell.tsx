import styled, { type AnyStyledComponent, css } from 'styled-components';

import type { Asset } from '@/constants/abacus';

import { breakpoints } from '@/styles';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { TableCell } from '@/components/Table';

export const MarketTableCell = ({
  asset,
  marketId,
  showFavorite,
  className,
}: {
  asset?: Asset;
  marketId: string;
  showFavorite?: boolean;
  className?: string;
}) => (
  <TableCell
    className={className}
    stacked
    slotLeft={
      <>
        {showFavorite && <Icon iconName={IconName.Star} />}
        <Styled.AssetIcon symbol={asset?.id} />
      </>
    }
  >
    <Styled.Asset>{asset?.name}</Styled.Asset>
    <span>{marketId}</span>
  </TableCell>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AssetIcon = styled(AssetIcon)`
  font-size: 1.25rem;

  @media ${breakpoints.tablet} {
    font-size: 2.25rem;
  }
`;

Styled.Asset = styled.span`
  @media ${breakpoints.tablet} {
    color: var(--color-text-2);
  }
`;
