import { Key, memo, useMemo, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, PREDICTION_MARKET, type MarketData } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';
import { StatSigFlags } from '@/constants/statsig';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useAllStatsigGateValues } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { DropdownIcon } from '@/components/DropdownIcon';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { Popover, TriggerType } from '@/components/Popover';
import { ColumnDef, Table } from '@/components/Table';
import { Tag } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';

import { getMarketMaxLeverage } from '@/state/perpetualsSelectors';

import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { MustBigNumber } from '@/lib/numbers';

import { MarketFilter } from './MarketFilter';

const MarketsDropdownContent = ({
  closeDropdown,
  onRowAction,
}: {
  closeDropdown: () => void;
  onRowAction?: (market: Key) => void;
}) => {
  const [filter, setFilter] = useState(MarketFilters.ALL);
  const stringGetter = useStringGetter();
  const [searchFilter, setSearchFilter] = useState<string>();
  const { filteredMarkets, marketFilters } = useMarketsData(filter, searchFilter);
  const navigate = useNavigate();
  const featureFlags = useAllStatsigGateValues();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  const columns = useMemo(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row) => row.displayId,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({
            assetId,
            displayId,
            isNew,
            effectiveInitialMarginFraction,
            initialMarginFraction,
          }) => (
            <$MarketName isFavorited={false}>
              {/* TRCL-1693 <Icon iconName={IconName.Star} /> */}
              <AssetIcon symbol={assetId} />
              <h2>{displayId}</h2>
              <Tag>
                <Output
                  type={OutputType.Multiple}
                  value={calculateMarketMaxLeverage({
                    effectiveInitialMarginFraction,
                    initialMarginFraction,
                  })}
                  fractionDigits={0}
                />
              </Tag>
              {isNew && <Tag isHighlighted>{stringGetter({ key: STRING_KEYS.NEW })}</Tag>}
            </$MarketName>
          ),
        },
        {
          columnKey: 'oraclePrice',
          getCellValue: (row) => row.oraclePrice,
          label: stringGetter({ key: STRING_KEYS.PRICE }),
          renderCell: ({ oraclePrice, tickSizeDecimals }) => (
            <$Output type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
          ),
        },
        {
          columnKey: 'priceChange24HPercent',
          getCellValue: (row) => row.priceChange24HPercent,
          label: stringGetter({ key: STRING_KEYS._24H }),
          renderCell: ({ priceChange24HPercent }) => (
            <div tw="inlineRow">
              {!priceChange24HPercent ? (
                <$Output type={OutputType.Text} value={null} />
              ) : (
                <$PriceChangeOutput
                  type={OutputType.Percent}
                  value={priceChange24HPercent}
                  isNegative={MustBigNumber(priceChange24HPercent).isNegative()}
                />
              )}
            </div>
          ),
        },
        {
          columnKey: 'volume24H',
          getCellValue: (row) => row.volume24H,
          label: stringGetter({ key: STRING_KEYS.VOLUME }),
          renderCell: ({ volume24H }) => (
            <$Output type={OutputType.CompactFiat} value={volume24H} />
          ),
        },
        {
          columnKey: 'openInterest',
          getCellValue: (row) => row.openInterestUSDC,
          label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
          renderCell: (row) => (
            <$Output type={OutputType.CompactFiat} value={row.openInterestUSDC} />
          ),
        },
      ] satisfies ColumnDef<MarketData>[],
    [stringGetter]
  );

  const slotBottom = useMemo(() => {
    if (filter === MarketFilters.PREDICTION_MARKET) {
      return (
        <div tw="p-1 text-color-text-0 font-small-medium">
          {stringGetter({ key: STRING_KEYS.PREDICTION_MARKET_DESC })}
        </div>
      );
    }

    return null;
  }, [filter, stringGetter]);

  const [hasSeenElectionBannerTrumpWin, setHasSeenElectionBannerTrupmWin] = useLocalStorage({
    key: LocalStorageKey.HasSeenElectionBannerTRUMPWIN,
    defaultValue: false,
  });

  const currentDate = new Date();

  const slotTop = useMemo(() => {
    if (
      !hasSeenElectionBannerTrumpWin &&
      featureFlags?.[StatSigFlags.ffShowPredictionMarketsUi] &&
      currentDate < new Date('2024-11-06T23:59:59')
    ) {
      return (
        <$MarketDropdownBanner>
          <$FlagGradient />
          <Link
            to={`${AppRoute.Trade}/${PREDICTION_MARKET.TRUMPWIN}`}
            onClick={() => {
              closeDropdown();
            }}
          >
            🇺🇸 {stringGetter({ key: STRING_KEYS.TRADE_US_PRESIDENTIAL_ELECTION })} →
          </Link>
          <$IconButton
            onClick={() => setHasSeenElectionBannerTrupmWin(true)}
            iconName={IconName.Close}
          />
        </$MarketDropdownBanner>
      );
    }

    return null;
  }, [
    currentDate,
    setHasSeenElectionBannerTrupmWin,
    hasSeenElectionBannerTrumpWin,
    stringGetter,
    closeDropdown,
    featureFlags,
  ]);

  return (
    <>
      <$Toolbar>
        <MarketFilter
          selectedFilter={filter}
          filters={marketFilters}
          onChangeFilter={setFilter}
          onSearchTextChange={setSearchFilter}
        />
      </$Toolbar>
      {slotTop}
      <$ScrollArea>
        <$Table
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
          initialPageSize={15}
          paginationBehavior="showAll"
          slotEmpty={
            <$MarketNotFound>
              {filter === MarketFilters.NEW && !searchFilter ? (
                <>
                  <h2>
                    {stringGetter({
                      key: STRING_KEYS.QUERY_NOT_FOUND,
                      params: { QUERY: stringGetter({ key: STRING_KEYS.NEW }) },
                    })}
                  </h2>
                  {hasPotentialMarketsData && (
                    <p>{stringGetter({ key: STRING_KEYS.ADD_DETAILS_TO_LAUNCH_MARKET })}</p>
                  )}
                </>
              ) : (
                <>
                  <h2>
                    {stringGetter({
                      key: STRING_KEYS.QUERY_NOT_FOUND,
                      params: { QUERY: searchFilter ?? '' },
                    })}
                  </h2>
                  <p>{stringGetter({ key: STRING_KEYS.MARKET_SEARCH_DOES_NOT_EXIST_YET })}</p>
                </>
              )}

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
            </$MarketNotFound>
          }
        />
        {slotBottom}
      </$ScrollArea>
    </>
  );
};

export const MarketsDropdown = memo(
  ({ currentMarketId, symbol = '' }: { currentMarketId?: string; symbol: string | null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const stringGetter = useStringGetter();
    const navigate = useNavigate();
    const marketMaxLeverage = useParameterizedSelector(getMarketMaxLeverage, currentMarketId);

    const leverageTag =
      currentMarketId != null ? (
        <Tag>
          <Output type={OutputType.Multiple} value={marketMaxLeverage} fractionDigits={0} />
        </Tag>
      ) : undefined;

    const triggerBackground = currentMarketId === PREDICTION_MARKET.TRUMPWIN && <$TriggerFlag />;

    return (
      <$Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        sideOffset={1}
        slotTrigger={
          <>
            {triggerBackground}
            <$TriggerContainer $isOpen={isOpen}>
              {isOpen ? (
                <h2 tw="text-color-text-2 font-medium-medium">
                  {stringGetter({ key: STRING_KEYS.SELECT_MARKET })}
                </h2>
              ) : (
                <div tw="spacedRow gap-0.625">
                  <AssetIcon symbol={symbol} />
                  <h2 tw="text-color-text-2 font-medium-medium">{currentMarketId}</h2>
                  {leverageTag}
                </div>
              )}
              <p tw="row gap-0.5 text-color-text-0 font-small-book">
                {stringGetter({ key: isOpen ? STRING_KEYS.TAP_TO_CLOSE : STRING_KEYS.ALL_MARKETS })}
                <DropdownIcon isOpen={isOpen} />
              </p>
            </$TriggerContainer>
          </>
        }
        triggerType={TriggerType.MarketDropdown}
      >
        <MarketsDropdownContent
          closeDropdown={() => setIsOpen(false)}
          onRowAction={(market: Key) => {
            navigate(`${AppRoute.Trade}/${market}`);
            setIsOpen(false);
          }}
        />
      </$Popover>
    );
  }
);

const $MarketName = styled.div<{ isFavorited: boolean }>`
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

const $TriggerContainer = styled.div<{ $isOpen: boolean }>`
  --marketsDropdown-width: var(--sidebar-width);
  width: var(--sidebar-width);
  position: relative;

  ${layoutMixins.spacedRow}
  padding: 0 1.25rem;

  transition: width 0.1s;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      --marketsDropdown-width: var(--marketsDropdown-openWidth);
    `}
`;

const $Popover = styled(Popover)`
  ${popoverMixins.popover}
  --popover-item-height: 3.375rem;
  --popover-backgroundColor: var(--color-layer-2);
  --stickyArea-topHeight: 6.125rem;

  --toolbar-height: var(--stickyArea-topHeight);

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
const $Toolbar = styled(Toolbar)`
  ${layoutMixins.stickyHeader}
  height: var(--toolbar-height);
  gap: 0.5rem;
  border-bottom: solid var(--border-width) var(--color-border);
`;

const $MarketDropdownBanner = styled.div`
  ${layoutMixins.row}
  background-color: var(--color-layer-1);
  padding: 0.9063rem 1rem;
  font: var(--font-base-medium);
  color: var(--color-text-1);
  border-bottom: solid var(--border-width) var(--color-border);
  justify-content: space-between;
  position: relative;

  & > * {
    z-index: 1;
  }
`;

const $IconButton = styled(IconButton)`
  --button-backgroundColor: transparent;
  --button-border: none;
`;

const $FlagGradient = styled.div`
  width: 573px;
  height: 100%;
  background-image: ${({ theme }) => `
    linear-gradient(90deg, ${theme.layer1} 0%, ${theme.tooltipBackground} 53%, ${theme.layer1} 99%),
    url('/AmericanFlag.png')
  `};
  background-repeat: no-repeat;
  position: absolute;
  z-index: 0;
  right: 0;
`;

const $TriggerFlag = styled.div`
  background: url('/AmericanFlag2.png') no-repeat;
  mix-blend-mode: luminosity;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const $ScrollArea = styled.div`
  ${layoutMixins.scrollArea}
  height: calc(100% - var(--toolbar-height));
`;
const $Table = styled(Table)`
  --tableCell-padding: 0.5rem 1rem;

  thead {
    --stickyArea-totalInsetTop: 0px;
    --stickyArea-totalInsetBottom: 0px;
    tr {
      height: var(--stickyArea-topHeight);
    }
  }

  tfoot {
    --stickyArea-totalInsetTop: 0px;
    --stickyArea-totalInsetBottom: 3px;

    tr {
      height: var(--stickyArea-bottomHeight);
    }
  }

  tr {
    height: var(--popover-item-height);
  }
` as typeof Table;
const $Output = styled(Output)<{ isNegative?: boolean }>`
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
  color: var(--color-text-2);
`;

const $PriceChangeOutput = styled(Output)<{ isNegative?: boolean }>`
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;

const $MarketNotFound = styled.div`
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
