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
  background-color: var(--color-layer-1);

  padding-top: 0.25rem;
  padding-bottom: 0.25rem;

  /* Completely override box-shadow border from withOuterAndInnerBorders */
  --border-color: transparent !important;
  box-shadow: none !important;

  /* Apply rounded border using border property which respects border-radius */
  border: var(--default-border-width, 1px) solid var(--color-border) !important;
  border-radius: 0.75rem !important;
  overflow: hidden; // Clip content and borders to rounded corners

  /* Use isolation to create a new stacking context */
  isolation: isolate;
  position: relative;

  /* Remove borders from all children to prevent hard edges */
  > * {
    --border-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
`;
