import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';
import { LaunchableMarketStatsDetails } from '@/views/LaunchableMarketStatsDetails';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { MarketsDropdown } from '@/views/MarketsDropdown';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketDisplayId } from '@/state/perpetualsSelectors';

import { getAssetFromMarketId, getDisplayableTickerFromMarket } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';

export const MarketSelectorAndStats = ({
  className,
  launchableMarketId,
}: {
  className?: string;
  launchableMarketId?: string;
}) => {
  const launchableImageUrl = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetLogo,
    mapIfPresent(launchableMarketId, getAssetFromMarketId)
  );
  const launchableId = mapIfPresent(launchableMarketId, getDisplayableTickerFromMarket);

  const tradeableImageUrl = useAppSelector(BonsaiHelpers.currentMarket.assetLogo);
  const tradeableMarketId = useAppSelector(getCurrentMarketDisplayId) ?? '';

  return (
    <$Container className={className}>
      <MarketsDropdown
        launchableMarketId={launchableMarketId}
        currentMarketId={launchableId ?? tradeableMarketId}
        logoUrl={launchableImageUrl ?? tradeableImageUrl}
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
