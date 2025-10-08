import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { DropdownIcon } from '@/components/DropdownIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Popover, TriggerType } from '@/components/Popover';
import { SearchInput } from '@/components/SearchInput';
import { ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { Toolbar } from '@/components/Toolbar';
import { FavoriteButton } from '@/views/tables/MarketsTable/FavoriteButton';

import { useAppSelector } from '@/state/appTypes';
import { getSpotFavorites } from '@/state/appUiConfigsSelectors';

import { truncateAddress } from '@/lib/wallet';

import { SpotMarketToken } from './types';

type SpotMarketsDropdownProps = {
  current: SpotMarketToken;
  searchResults: SpotMarketToken[];
  onSelect: (token: SpotMarketToken) => void;
  onSearchTextChange?: (value: string) => void;
  className?: string;
};

export const SpotMarketsDropdown = ({
  current,
  searchResults,
  onSelect,
  onSearchTextChange,
  className,
}: SpotMarketsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const favoritedTokenAddresses = useAppSelector(getSpotFavorites);
  const favoritedSet = useMemo(() => new Set(favoritedTokenAddresses), [favoritedTokenAddresses]);

  const columns = useMemo(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row) => row.name,
          label: 'Name',
          renderCell: ({ symbol, logoUrl, tokenAddress }) => (
            <div tw="flex items-center gap-0.25">
              <FavoriteButton marketId={tokenAddress} variant="spot" />
              <$AssetIcon logoUrl={logoUrl} symbol={symbol} />
              <div tw="flex flex-col">
                <h2>{symbol}</h2>
                <span tw="text-color-text-0 font-mini-book">
                  {truncateAddress(tokenAddress, '')}
                </span>
              </div>
            </div>
          ),
        },
        {
          columnKey: 'volume24h',
          getCellValue: (row) => row.volume24hUsd ?? 0,
          label: 'Volume',
          renderCell: ({ volume24hUsd }) => (
            <Output type={OutputType.CompactFiat} value={volume24hUsd} />
          ),
        },
        {
          columnKey: 'price',
          getCellValue: (row: SpotMarketToken) => row.priceUsd ?? 0,
          label: 'Price',
          renderCell: ({ priceUsd }) => <Output type={OutputType.Fiat} value={priceUsd} />,
        },
        {
          columnKey: 'marketCap',
          getCellValue: (row) => row.marketCapUsd ?? 0,
          label: 'Market Cap',
          renderCell: ({ marketCapUsd, change24hPercent }) => (
            <TableCell stacked>
              <Output type={OutputType.CompactFiat} value={marketCapUsd} />
              <Output
                type={OutputType.Percent}
                value={change24hPercent}
                showSign={ShowSign.Both}
                withPolarityColor
              />
            </TableCell>
          ),
        },
      ] satisfies ColumnDef<SpotMarketToken>[],
    []
  );

  return (
    <$Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      noBlur
      sideOffset={1}
      className={className}
      slotTrigger={
        <$TriggerContainer $isOpen={isOpen}>
          <div tw="flex items-center gap-0.25">
            <$AssetIconWithStar>
              {favoritedSet.has(current.tokenAddress) && (
                <$FavoriteStatus iconName={IconName.Star} />
              )}
              <$AssetIcon
                logoUrl={current.logoUrl ?? undefined}
                symbol={current.symbol}
                tw="mr-0.25"
              />
            </$AssetIconWithStar>
            <h2 tw="text-color-text-2 font-medium-medium">{current.symbol}</h2>
          </div>
          <p tw="row gap-0.5 text-color-text-0 font-small-book">
            <DropdownIcon isOpen={isOpen} />
          </p>
        </$TriggerContainer>
      }
      triggerType={TriggerType.MarketDropdown}
    >
      <div tw="flex h-full flex-col">
        <$Toolbar>
          <$SearchInput placeholder="Search markets" onTextChange={onSearchTextChange} />
        </$Toolbar>
        <$ScrollArea>
          <$Table
            withInnerBorders
            data={searchResults}
            tableId="spot-markets-dropdown"
            getRowKey={(row) => row.tokenAddress}
            onRowAction={(_, row) => {
              onSelect(row);
              setIsOpen(false);
            }}
            defaultSortDescriptor={{ column: 'volume24h', direction: 'descending' }}
            label="Spot"
            columns={columns}
            initialPageSize={50}
            paginationBehavior="paginate"
            shouldResetOnTotalRowsChange
            getIsRowPinned={(row) => favoritedSet.has(row.tokenAddress)}
          />
        </$ScrollArea>
      </div>
    </$Popover>
  );
};

const $Toolbar = styled(Toolbar)`
  gap: 0.5rem;
  border-bottom: solid var(--border-width) var(--color-border);
  padding: 1rem 1rem 0.5rem;
`;

const $SearchInput = styled(SearchInput)`
  min-width: 12rem;
  flex-grow: 1;
` as typeof SearchInput;

const $TriggerContainer = styled.div<{ $isOpen: boolean }>`
  position: relative;

  ${layoutMixins.spacedRow}
  padding: 0 1.25rem;

  transition: width 0.1s;
  gap: 1rem;
`;

const $Popover = styled(Popover)`
  ${popoverMixins.popover}
  --popover-item-height: 2.75rem;

  --popover-backgroundColor: var(--color-layer-2);
  display: flex;
  flex-direction: column;

  height: calc(
    100vh - var(--page-header-height) - var(--market-info-row-height) - var(--page-footer-height) - var(
        --restriction-warning-currentHeight
      )
  );

  width: var(--marketsDropdown-openWidth);

  max-width: 100vw;

  box-shadow: 0 0 0 1px var(--color-border);
  border-radius: 0;

  &:focus-visible {
    outline: none;
  }
`;

const $ScrollArea = styled.div`
  overflow: scroll;
  position: relative;
  height: 100%;
`;

const $Table = styled(Table)`
  --tableCell-padding: 0.5rem 1rem;
  --table-header-height: 2.25rem;

  thead {
    --stickyArea-totalInsetTop: 0px;
    --stickyArea-totalInsetBottom: 0px;
    background-color: var(--color-layer-2);

    tr {
      height: var(--stickyArea-topHeight);
    }
  }

  tfoot {
    --stickyArea-totalInsetTop: 0px;
    --stickyArea-totalInsetBottom: 3px;
    background-color: var(--color-layer-2);

    tr {
      height: var(--stickyArea-bottomHeight);
    }
  }

  tr {
    height: var(--popover-item-height);
  }
` as typeof Table;

const $AssetIcon = styled(AssetIcon)`
  --asset-icon-size: 1.5em;
`;

const $FavoriteStatus = styled(Icon)`
  --icon-size: 0.75em;
  --icon-color: ${({ theme }) => theme.profileYellow};
  color: var(--icon-color);
  fill: var(--icon-color);
  z-index: 1;
`;

const $AssetIconWithStar = styled.div`
  ${layoutMixins.stack}

  ${$AssetIcon} {
    margin: 0.2rem;
  }
`;
