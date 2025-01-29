import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';
import { LaunchableMarketStatsDetails } from '@/views/LaunchableMarketStatsDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { MarketsDropdown } from '@/views/MarketsDropdown';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketDisplayId } from '@/state/perpetualsSelectors';

import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';

export const MarketSelectorAndStats = ({
  className,
  launchableMarketId,
}: {
  className?: string;
  launchableMarketId?: string;
}) => {
  const imageUrl = useAppSelector(BonsaiHelpers.currentMarket.assetLogo);
  const currentMarketId = useAppSelector(getCurrentMarketDisplayId) ?? '';

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

      <VerticalSeparator fullHeight />

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
