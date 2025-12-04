import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { VerticalSeparator } from '@/components/Separator';

import { SpotMarketStatsRow } from './SpotMarketStatsRow';
import { SpotMarketsDropdown } from './SpotMarketsDropdown';
import { SpotHeaderToken } from './types';

export type SpotHeaderProps = {
  currentToken?: SpotHeaderToken | null;
  searchResults?: SpotHeaderToken[];
  isSearchLoading?: boolean;
  isTokenLoading?: boolean;
  onTokenSelect: (token: SpotHeaderToken) => void;
  onSearchTextChange?: (value: string) => void;
  className?: string;
};

export const SpotHeader = ({
  currentToken,
  searchResults = [],
  isSearchLoading,
  isTokenLoading,
  onTokenSelect,
  onSearchTextChange,
  className,
}: SpotHeaderProps) => {
  return (
    <$Container className={className}>
      <SpotMarketsDropdown
        current={currentToken}
        searchResults={searchResults}
        isSearchLoading={isSearchLoading}
        onSelect={onTokenSelect}
        onSearchTextChange={onSearchTextChange}
        isTokenLoading={isTokenLoading}
      />
      <VerticalSeparator fullHeight />
      <SpotMarketStatsRow stats={currentToken} isLoading={isTokenLoading} />
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
