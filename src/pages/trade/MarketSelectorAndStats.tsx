import styled, { type AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { DEFAULT_MARKETID } from '@/constants/markets';
import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { MarketsDropdown } from '@/views/MarketsDropdown';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';

export const MarketSelectorAndStats = ({ className }: { className?: string }) => {
  const { symbol = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const currentMarketId = useSelector(getCurrentMarketId) ?? DEFAULT_MARKETID;

  return (
    <Styled.Container className={className}>
      <MarketsDropdown currentMarketId={currentMarketId} symbol={symbol} />

      <VerticalSeparator />

      <MarketStatsDetails />
    </Styled.Container>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  ${layoutMixins.container}

  display: grid;

  grid-template:
    var(--market-info-row-height)
    / auto;

  grid-auto-flow: column;
  justify-content: start;
  align-items: stretch;
`;
