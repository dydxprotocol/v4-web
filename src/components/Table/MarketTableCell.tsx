import styled from 'styled-components';

import type { Asset } from '@/constants/abacus';

import breakpoints from '@/styles/breakpoints';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';

import { Output, OutputType, ShowSign } from '../Output';
import { TableCell } from './TableCell';

export const MarketTableCell = ({
  asset,
  marketId,
  leverage,
  showFavorite,
  isHighlighted,
  className,
}: {
  asset?: Asset;
  marketId: string;
  leverage?: number;
  showFavorite?: boolean;
  isHighlighted?: boolean;
  className?: string;
}) => (
  <TableCell
    className={className}
    isHighlighted={isHighlighted}
    stacked
    slotLeft={
      <>
        {showFavorite && <Icon iconName={IconName.Star} />}
        <$AssetIcon symbol={asset?.id} />
      </>
    }
  >
    {leverage ? (
      <>
        <span>{marketId}</span>
        <Output type={OutputType.Multiple} value={leverage} showSign={ShowSign.None} />
      </>
    ) : (
      <>
        <$Asset>{asset?.name}</$Asset>
        <span>{marketId}</span>
      </>
    )}
  </TableCell>
);
const $AssetIcon = styled(AssetIcon)`
  font-size: 1.25rem;

  @media ${breakpoints.tablet} {
    font-size: 2.25rem;
  }
`;

const $Asset = styled.span`
  @media ${breakpoints.tablet} {
    color: var(--color-text-2);
  }
`;
