import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { MarketsDropdown } from '@/views/MarketsDropdown';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

export const MarketSelectorAndStats = ({ className }: { className?: string }) => {
  const { id = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const currentMarketId = useSelector(getCurrentMarketId);

  return (
    <$Container className={className}>
      <MarketsDropdown currentMarketId={currentMarketId} symbol={id} />

      <VerticalSeparator />

      <MarketStatsDetails />
    </$Container>
  );
};
const $Container = styled.div`
  ${layoutMixins.container}

  display: grid;

  grid-template:
    var(--market-info-row-height)
    / auto;

  grid-auto-flow: column;
  justify-content: start;
  align-items: stretch;
`;
