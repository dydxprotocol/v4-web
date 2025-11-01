import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';

import { SpotMarketStatsRow } from './SpotMarketStatsRow';
import { SpotMarketsDropdown } from './SpotMarketsDropdown';
import { SpotMarketToken } from './types';

type SpotHeaderProps = {
  currentToken: SpotMarketToken;
  searchResults: SpotMarketToken[];
  onTokenSelect: (token: SpotMarketToken) => void;
  onSearchTextChange?: (value: string) => void;
  className?: string;
};

export const SpotHeader = ({
  currentToken,
  searchResults,
  onTokenSelect,
  onSearchTextChange,
  className,
}: SpotHeaderProps) => {
  return (
    <$Container className={className}>
      <SpotMarketsDropdown
        current={currentToken}
        searchResults={searchResults}
        onSelect={onTokenSelect}
        onSearchTextChange={onSearchTextChange}
      />
      <VerticalSeparator fullHeight />
      <SpotMarketStatsRow stats={currentToken} />
    </$Container>
  );
};

const $Container = styled.div`
  ${layoutMixins.container}
  ${layoutMixins.scrollAreaFadeEnd}

  display: grid;
  grid-template: var(--market-info-row-height) / auto;
  grid-auto-flow: column;
  justify-content: start;
  align-items: stretch;
`;
