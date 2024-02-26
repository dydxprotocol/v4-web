import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { type AnyStyledComponent, css, keyframes } from 'styled-components';
import { useSelector } from 'react-redux';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, type MarketData } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { usePerpetualMarketSparklines, useStringGetter } from '@/hooks';
import { useMarketsData } from '@/hooks/useMarketsData';
import { SEVEN_DAY_SPARKLINE_ENTRIES } from '@/hooks/usePerpetualMarketSparklines';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { popoverMixins } from '@/styles/popoverMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Popover, TriggerType } from '@/components/Popover';
import { ColumnDef, Table } from '@/components/Table';
import { Tag } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';

import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber } from '@/lib/numbers';

import { MarketFilter } from './MarketFilter';

const MarketsDropdownContent = ({ onRowAction }: { onRowAction?: (market: string) => void }) => {
  const [filter, setFilter] = useState(MarketFilters.ALL);
  const stringGetter = useStringGetter();
  const selectedLocale = useSelector(getSelectedLocale);
  const [searchFilter, setSearchFilter] = useState<string>();
  const { filteredMarkets, marketFilters } = useMarketsData(filter, searchFilter);
  const navigate = useNavigate();
  const { hasPotentialMarketsData } = usePotentialMarkets();
  const sparklineData = usePerpetualMarketSparklines();

  const columns = useMemo(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row) => row.market,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({ assetId, id }) => (
            <Styled.MarketName isFavorited={false}>
              {/* TRCL-1693 <Icon iconName={IconName.Star} /> */}
              <AssetIcon symbol={assetId} />
              <h2>{id}</h2>
              <Tag>{assetId}</Tag>
              {console.log(sparklineData?.[id])}
              {sparklineData?.[id] && sparklineData[id].length < SEVEN_DAY_SPARKLINE_ENTRIES && (
                <Tag isHighlighted>{stringGetter({ key: STRING_KEYS.NEW })}</Tag>
              )}
            </Styled.MarketName>
          ),
        },
        {
          columnKey: 'oraclePrice',
          getCellValue: (row) => row.oraclePrice,
          label: stringGetter({ key: STRING_KEYS.PRICE }),
          renderCell: ({ oraclePrice, tickSizeDecimals }) => (
            <Styled.Output
              type={OutputType.Fiat}
              value={oraclePrice}
              fractionDigits={tickSizeDecimals}
            />
          ),
        },
        {
          columnKey: 'priceChange24HPercent',
          getCellValue: (row) => row.priceChange24HPercent,
          label: stringGetter({ key: STRING_KEYS._24H }),
          renderCell: ({ priceChange24HPercent }) => (
            <Styled.InlineRow>
              {!priceChange24HPercent ? (
                <Styled.Output type={OutputType.Text} value={null} />
              ) : (
                <Styled.PriceChangeOutput
                  type={OutputType.Percent}
                  value={priceChange24HPercent}
                  isNegative={MustBigNumber(priceChange24HPercent).isNegative()}
                />
              )}
            </Styled.InlineRow>
          ),
        },
        {
          columnKey: 'volume24H',
          getCellValue: (row) => row.volume24H,
          label: stringGetter({ key: STRING_KEYS.VOLUME }),
          renderCell: ({ volume24H }) => (
            <Styled.Output
              type={OutputType.CompactFiat}
              value={volume24H}
              locale={selectedLocale}
            />
          ),
        },
        {
          columnKey: 'openInterest',
          getCellValue: (row) => row.openInterestUSDC,
          label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
          renderCell: (row) => (
            <Styled.Output
              type={OutputType.CompactFiat}
              value={row.openInterestUSDC}
              locale={selectedLocale}
            />
          ),
        },
      ] as ColumnDef<MarketData>[],
    [stringGetter, !!sparklineData, selectedLocale]
  );

  return (
    <>
      <Styled.Toolbar>
        <MarketFilter
          selectedFilter={filter}
          filters={marketFilters as MarketFilters[]}
          onChangeFilter={setFilter}
          onSearchTextChange={setSearchFilter}
        />
      </Styled.Toolbar>
      <Styled.ScrollArea>
        <Styled.Table
          withInnerBorders
          data={filteredMarkets}
          getRowKey={(row: MarketData) => row.id}
          onRowAction={onRowAction}
          defaultSortDescriptor={{
            column: 'volume24H',
            direction: 'descending',
          }}
          label={stringGetter({ key: STRING_KEYS.MARKETS })}
          columns={columns}
          slotEmpty={
            <Styled.MarketNotFound>
              <h2>
                {stringGetter({
                  key: STRING_KEYS.QUERY_NOT_FOUND,
                  params: { QUERY: searchFilter ?? '' },
                })}
              </h2>
              <p>{stringGetter({ key: STRING_KEYS.MARKET_SEARCH_DOES_NOT_EXIST_YET })}</p>
              {hasPotentialMarketsData && (
                <div>
                  <Button
                    onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
                    size={ButtonSize.Small}
                  >
                    {stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })}
                  </Button>
                </div>
              )}
            </Styled.MarketNotFound>
          }
        />
      </Styled.ScrollArea>
    </>
  );
};

export const MarketsDropdown: React.FC<{ currentMarketId?: string; symbol: string | null }> = memo(
  ({ currentMarketId, symbol = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const stringGetter = useStringGetter();
    const navigate = useNavigate();

    return (
      <Styled.Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        sideOffset={1}
        slotTrigger={
          <Styled.TriggerContainer $isOpen={isOpen}>
            {isOpen ? (
              <h2>{stringGetter({ key: STRING_KEYS.SELECT_MARKET })}</h2>
            ) : (
              <div>
                <AssetIcon symbol={symbol} />
                <h2>{currentMarketId}</h2>
              </div>
            )}
            <p>
              {stringGetter({ key: isOpen ? STRING_KEYS.TAP_TO_CLOSE : STRING_KEYS.ALL_MARKETS })}
              <Styled.DropdownIcon aria-hidden="true">
                <Icon iconName={IconName.Triangle} aria-hidden="true" />
              </Styled.DropdownIcon>
            </p>
          </Styled.TriggerContainer>
        }
        triggerType={TriggerType.MarketDropdown}
      >
        <MarketsDropdownContent
          onRowAction={(market: string) => {
            navigate(`${AppRoute.Trade}/${market}`);
            setIsOpen(false);
          }}
        />
      </Styled.Popover>
    );
  }
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketName = styled.div<{ isFavorited: boolean }>`
  ${layoutMixins.row}
  gap: 0.5rem;

  svg {
    color: var(--color-text-0);
  }

  ${({ isFavorited }) =>
    isFavorited &&
    css`
      svg {
        color: var(--color-favorite);

        path {
          fill: var(--color-favorite);
        }
      }
    `}
`;

Styled.TriggerContainer = styled.div<{ $isOpen: boolean }>`
  --marketsDropdown-width: var(--sidebar-width);
  width: var(--sidebar-width);

  ${layoutMixins.spacedRow}
  padding: 0 1.25rem;

  transition: width 0.1s;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      --marketsDropdown-width: var(--marketsDropdown-openWidth);
    `}

  > :first-child {
    ${layoutMixins.row}
    gap: 0.625rem;

    img {
      width: 1.5rem;
      height: 1.5rem;
    }

    h2 {
      color: var(--color-text-1);
      font: var(--font-medium-medium);
    }
  }

  > :last-child {
    ${layoutMixins.row}
    gap: 0.5rem;

    color: var(--color-text-0);
    font: var(--font-small-book);
  }
`;

Styled.DropdownIcon = styled.span`
  margin-left: auto;

  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);

  font-size: 0.375rem;

  ${Styled.Trigger}[data-state='open'] & {
    transform: scaleY(-1);
  }
`;

Styled.Popover = styled(Popover)`
  ${popoverMixins.popover}
  --popover-item-height: 3.375rem;
  --popover-backgroundColor: var(--color-layer-2);
  --stickyArea-topHeight: var(--popover-item-height);

  height: calc(
    100vh - var(--page-header-height) - var(--market-info-row-height) - var(--page-footer-height)
  );

  width: var(--marketsDropdown-openWidth);
  max-width: 100vw;

  box-shadow: 0 0 0 1px var(--color-border);
  border-radius: 0;

  &[data-state='open'] {
    animation: ${keyframes`
      from {
        opacity: 0;
        scale: 0.9;
        max-height: 0;
      }
    `} 0.2s var(--ease-out-expo);
  }

  &[data-state='closed'] {
    animation: ${keyframes`
      to {
        opacity: 0;
        scale: 0.95;
        max-height: 0;
      }
    `} 0.2s;
  }
  &:focus-visible {
    outline: none;
  }
`;

Styled.Toolbar = styled(Toolbar)`
  ${layoutMixins.stickyHeader}
  height: var(--stickyArea-topHeight);

  border-bottom: solid var(--border-width) var(--color-border);
`;

Styled.ScrollArea = styled.div`
  ${layoutMixins.scrollArea}
  height: calc(100% - var(--popover-item-height));
`;

Styled.Table = styled(Table)`
  thead {
    --stickyArea-totalInsetTop: 0px;
    --stickyArea-totalInsetBottom: 0px;
    tr {
      height: var(--stickyArea-topHeight);
    }
  }

  tr {
    height: var(--popover-item-height);
  }
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.Output = styled(Output)<{ isNegative?: boolean }>`
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
  color: var(--color-text-2);
`;

Styled.PriceChangeOutput = styled(Output)<{ isNegative?: boolean }>`
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;

Styled.MarketNotFound = styled.div`
  ${layoutMixins.column}
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2rem 1.5rem;

  h2 {
    font: var(--font-medium-book);
    font-weight: 500;
  }
`;
