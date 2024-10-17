import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';
import { LaunchableMarketStatsDetails } from '@/views/LaunchableMarketStatsDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { MarketsDropdown } from '@/views/MarketsDropdown';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketDisplayId } from '@/state/perpetualsSelectors';

import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { testFlags } from '@/lib/testFlags';
import { orEmptyObj } from '@/lib/typeUtils';

export const MarketSelectorAndStats = ({
  className,
  launchableMarketId,
}: {
  className?: string;
  launchableMarketId?: string;
}) => {
  const { resources } = orEmptyObj(useAppSelector(getCurrentMarketAssetData, shallowEqual));
  const { imageUrl } = orEmptyObj(resources);
  const currentMarketId = useAppSelector(getCurrentMarketDisplayId) ?? '';

  const { uiRefresh } = testFlags;

  const displayableId = launchableMarketId
    ? getDisplayableTickerFromMarket(launchableMarketId)
    : launchableMarketId;

  return (
    <$Container className={className}>
      <MarketsDropdown
        launchableMarketId={launchableMarketId}
        currentMarketId={displayableId ?? currentMarketId}
        logoUrl={imageUrl}
      />

      <VerticalSeparator fullHeight={!!uiRefresh} />

      {launchableMarketId ? (
        <LaunchableMarketStatsDetails launchableMarketId={launchableMarketId} />
      ) : (
        <MarketStatsDetails />
      )}
    </$Container>
  );
};
const $Container = styled.div`
  ${layoutMixins.container}
  ${layoutMixins.scrollAreaFadeEnd}
  
  display: grid;

  grid-template:
    var(--market-info-row-height)
    / auto;

  grid-auto-flow: column;
  justify-content: start;
  align-items: stretch;
`;
