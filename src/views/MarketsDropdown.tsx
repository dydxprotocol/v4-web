import { Key, memo, useEffect, useMemo, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { ButtonStyle } from '@/constants/buttons';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, PREDICTION_MARKET, type MarketData } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';
import { StatsigFlags } from '@/constants/statsig';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useMetadataServiceAssetFromId } from '@/hooks/useMetadataService';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useAllStatsigGateValues } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { DropdownIcon } from '@/components/DropdownIcon';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { Popover, TriggerType } from '@/components/Popover';
import { ColumnDef, Table } from '@/components/Table';
import { Tag } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getIsMarketFavorited } from '@/state/appUiConfigsSelectors';
import { setMarketFilter } from '@/state/perpetuals';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import { elementIsTextInput } from '@/lib/domUtils';
import { isTruthy } from '@/lib/isTruthy';
import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { MustBigNumber } from '@/lib/numbers';

import { MarketFilter } from './MarketFilter';
import { FavoriteButton } from './tables/MarketsTable/FavoriteButton';

const MarketsDropdownContent = ({
  closeDropdown,
  onRowAction,
}: {
  closeDropdown: () => void;
  onRowAction?: (market: Key) => void;
}) => {
  const dispatch = useAppDispatch();
  const filter: MarketFilters = useAppSelector(getMarketFilter);
  const stringGetter = useStringGetter();
  const [searchFilter, setSearchFilter] = useState<string>();
  const featureFlags = useAllStatsigGateValues();

  const setFilter = (newFilter: MarketFilters) => {
    dispatch(setMarketFilter(newFilter));
  };

  const { filteredMarkets, marketFilters } = useMarketsData({
    filter,
    searchFilter,
  });

  const columns = useMemo(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row: MarketData) => row.displayId,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({
            id,
            assetId,
            displayId,
            logo,
            isNew,
            isUnlaunched,
            effectiveInitialMarginFraction,
            initialMarginFraction,
          }: MarketData) => (
            <div tw="flex items-center gap-0.25">
              <FavoriteButton marketId={id} />
              <$AssetIcon logoUrl={logo} symbol={assetId} />
              <h2>{displayId}</h2>
              <Tag>
                {isUnlaunched ? (
                  stringGetter({ key: STRING_KEYS.LAUNCHABLE })
                ) : (
                  <Output
                    type={OutputType.Multiple}
                    value={calculateMarketMaxLeverage({
                      effectiveInitialMarginFraction,
                      initialMarginFraction,
                    })}
                    fractionDigits={0}
                  />
                )}
              </Tag>
              {isNew && <Tag isHighlighted>{stringGetter({ key: STRING_KEYS.NEW })}</Tag>}
            </div>
          ),
        },
        {
          columnKey: 'oraclePrice',
          getCellValue: (row: MarketData) => row.oraclePrice,
          label: stringGetter({ key: STRING_KEYS.PRICE }),
          renderCell: ({ oraclePrice, tickSizeDecimals }: MarketData) => (
            <$Output
              withSubscript
              type={OutputType.Fiat}
              value={oraclePrice}
              fractionDigits={tickSizeDecimals}
            />
          ),
        },
        {
          columnKey: 'priceChange24HPercent',
          getCellValue: (row: MarketData) => row.percentChange24h,
          label: stringGetter({ key: STRING_KEYS._24H }),
          renderCell: ({ percentChange24h }: MarketData) => (
            <div tw="inlineRow">
              {!percentChange24h ? (
                <$Output type={OutputType.Text} value={null} />
              ) : (
                <$PriceChangeOutput
                  type={OutputType.Percent}
                  value={percentChange24h}
                  isNegative={MustBigNumber(percentChange24h).isNegative()}
                />
              )}
            </div>
          ),
        },
        {
          columnKey: 'volume24H',
          getCellValue: (row: MarketData) => row.volume24h,
          label: stringGetter({ key: STRING_KEYS.VOLUME }),
          renderCell: (row: MarketData) => (
            <$Output type={OutputType.CompactFiat} value={row.volume24h} />
          ),
        },
        {
          columnKey: 'spotVolume24H',
          getCellValue: (row: MarketData) => row.spotVolume24h,
          label: stringGetter({ key: STRING_KEYS.SPOT_VOLUME_24H }),
          renderCell: (row: MarketData) => (
            <$Output type={OutputType.CompactFiat} value={row.spotVolume24h} />
          ),
        },
        {
          columnKey: 'marketCap',
          getCellValue: (row: MarketData) => row.marketCap,
          label: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
          renderCell: (row: MarketData) => (
            <$Output type={OutputType.CompactFiat} value={row.marketCap} />
          ),
        },
      ].filter(isTruthy) satisfies ColumnDef<MarketData>[],
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

  const slotTop = useMemo(() => {
    const currentDate = new Date();

    if (
      !hasSeenElectionBannerTrumpWin &&
      featureFlags[StatsigFlags.ffShowPredictionMarketsUi] &&
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
          <IconButton
            tw="[--button-icon-size:0.8em]"
            onClick={() => setHasSeenElectionBannerTrupmWin(true)}
            iconName={IconName.Close}
            buttonStyle={ButtonStyle.WithoutBackground}
          />
        </$MarketDropdownBanner>
      );
    }

    return null;
  }, [
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
          tableId="markets-dropdown"
          getRowKey={(row: MarketData) => row.id}
          getIsRowPinned={(row: MarketData) => row.isFavorite}
          onRowAction={onRowAction}
          defaultSortDescriptor={{
            column: 'volume24H',
            direction: 'descending',
          }}
          label={stringGetter({ key: STRING_KEYS.MARKETS })}
          columns={columns}
          initialPageSize={50}
          paginationBehavior="paginate"
          shouldResetOnTotalRowsChange
          slotEmpty={
            <$MarketNotFound>
              {filter === MarketFilters.NEW && !searchFilter ? (
                <h2>
                  {stringGetter({
                    key: STRING_KEYS.QUERY_NOT_FOUND,
                    params: { QUERY: stringGetter({ key: STRING_KEYS.NEW }) },
                  })}
                </h2>
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
            </$MarketNotFound>
          }
        />
        {slotBottom}
      </$ScrollArea>
    </>
  );
};

export const MarketsDropdown = memo(
  ({
    currentMarketId,
    launchableMarketId,
    logoUrl = '',
  }: {
    currentMarketId?: string;
    launchableMarketId?: string;
    logoUrl: Nullable<string>;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const stringGetter = useStringGetter();
    const navigate = useNavigate();
    const launchableAsset = useMetadataServiceAssetFromId(launchableMarketId);

    const triggerBackground = currentMarketId === PREDICTION_MARKET.TRUMPWIN && <$TriggerFlag />;

    useEffect(() => {
      // listen for '/' key to open the dropdown
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== '/' || !event.target) return;

        const isTextInput = elementIsTextInput(event.target as HTMLElement);

        if (!isTextInput) {
          event.preventDefault();
          setIsOpen(true);
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    const isFavoritedMarket = useParameterizedSelector(getIsMarketFavorited, currentMarketId ?? '');

    return (
      <$Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        sideOffset={1}
        slotTrigger={
          <>
            {triggerBackground}
            <$TriggerContainer $isOpen={isOpen}>
              <div tw="spacedRow gap-0.625">
                {launchableAsset ? (
                  <>
                    <img
                      src={launchableAsset.logo}
                      alt={launchableAsset.name}
                      tw="h-[1em] w-auto rounded-[50%]"
                    />

                    <div tw="flex flex-col text-start">
                      <span tw="font-mini-book">
                        {stringGetter({ key: STRING_KEYS.NOT_LAUNCHED })}
                      </span>
                      <h2 tw="mt-[-0.25rem] text-color-text-2 font-medium-medium">
                        {currentMarketId}
                      </h2>
                    </div>
                  </>
                ) : (
                  <div tw="flex items-center gap-0.25">
                    <$AssetIconWithStar>
                      {isFavoritedMarket && <$FavoriteStatus iconName={IconName.Star} />}
                      <$AssetIcon logoUrl={logoUrl} tw="mr-0.25" />
                    </$AssetIconWithStar>
                    <h2 tw="text-color-text-2 font-medium-medium">{currentMarketId}</h2>
                  </div>
                )}
              </div>
              <p tw="row gap-0.5 text-color-text-0 font-small-book">
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

const $Toolbar = styled(Toolbar)`
  gap: 0.5rem;
  border-bottom: solid var(--border-width) var(--color-border);
  padding: 1rem 1rem 0.5rem;
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

const $AssetIcon = styled(AssetIcon)`
  --asset-icon-size: 1.5em;
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

const $FavoriteStatus = styled(Icon)`
  --icon-size: 0.75em;
  --icon-color: ${({ theme }) => theme.profileYellow};
  place-self: start;

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
