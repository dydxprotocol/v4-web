import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import styled, { css } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { FUNDING_DECIMALS, LARGE_TOKEN_DECIMALS } from '@/constants/numbers';
import { DisplayUnit } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DisplayUnitTag } from '@/components/DisplayUnitTag';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { WithTooltip } from '@/components/WithTooltip';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { NextFundingTimer } from '@/views/NextFundingTimer';
import { MobileTradeAssetSelector } from '@/views/mobile/MobileTradeAssetSelector';
import { FavoriteButton } from '@/views/tables/MarketsTable/FavoriteButton';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { setIsUserMenuOpen } from '@/state/dialogs';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

enum MarketStats {
  OraclePrice = 'OraclePrice',
  PriceChange24H = 'PriceChange24H',
  Volume24H = 'Volume24H',
  Trades24H = 'Trades24H',
  OpenInterest = 'OpenInterest',
  Funding1H = 'Funding1H',
  NextFunding = 'NextFunding',
}

export const TradeHeaderMobile = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const id = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const marketInfo = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.marketInfo));
  const loadingState = useAppSelector(BonsaiCore.markets.markets.loading);
  const isLoading = loadingState === 'pending';

  const {
    displayableAsset,
    nextFundingRate,
    openInterest,
    openInterestUSDC,
    oraclePrice,
    percentChange24h,
    priceChange24H,
    tickSizeDecimals,
    trades24H,
    volume24H,
  } = orEmptyObj(marketInfo);

  const displayUnit = useAppSelector(getSelectedDisplayUnit);

  const valueMap = {
    [MarketStats.OraclePrice]: oraclePrice,
    [MarketStats.NextFunding]: undefined, // hardcoded
    [MarketStats.Funding1H]: nextFundingRate,
    [MarketStats.OpenInterest]: displayUnit === DisplayUnit.Fiat ? openInterestUSDC : openInterest,
    [MarketStats.PriceChange24H]: priceChange24H,
    [MarketStats.Trades24H]: trades24H,
    [MarketStats.Volume24H]: volume24H,
  };

  const labelMap = {
    [MarketStats.OraclePrice]: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
    [MarketStats.NextFunding]: stringGetter({ key: STRING_KEYS.NEXT_FUNDING }),
    [MarketStats.Funding1H]: stringGetter({ key: STRING_KEYS.FUNDING_RATE_1H_SHORT }),
    [MarketStats.OpenInterest]: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
    [MarketStats.PriceChange24H]: stringGetter({ key: STRING_KEYS.CHANGE_24H }),
    [MarketStats.Trades24H]: stringGetter({ key: STRING_KEYS.TRADES_24H }),
    [MarketStats.Volume24H]: stringGetter({ key: STRING_KEYS.VOLUME_24H }),
  };

  const openUserMenu = () => {
    dispatch(setIsUserMenuOpen(true));
  };

  return (
    <div tw="overflow-hidden">
      <$TopHeader>
        {id && <FavoriteButton marketId={id} tw="ml-[-0.5rem]" />}

        <MobileTradeAssetSelector launchableMarketId={launchableMarketId} />

        <Button
          tw="size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
          shape={ButtonShape.Circle}
          size={ButtonSize.XSmall}
          onClick={openUserMenu}
        >
          <Icon iconName={IconName.Menu} />
        </Button>
      </$TopHeader>
      <MarketStatsDetails showMidMarketPrice={false} horizontal withSubscript={false} />
    </div>
  );
};

const DetailsItem = ({
  value,
  stat,
  tickSizeDecimals,
  assetId,
  isLoading,
  priceChange24HPercent,
  useFiatDisplayUnit,
}: {
  value: string | number | null | undefined;
  stat: MarketStats;
  tickSizeDecimals: number | null | undefined;
  assetId: string;
  isLoading: boolean;
  priceChange24HPercent: number | null | undefined;
  useFiatDisplayUnit: boolean;
}) => {
  const valueBN = MustBigNumber(value);
  const stringGetter = useStringGetter();

  const color = valueBN.isNegative() ? 'var(--color-negative)' : 'var(--color-positive)';

  switch (stat) {
    case MarketStats.OraclePrice: {
      return <$Output type={OutputType.Fiat} value={value} fractionDigits={tickSizeDecimals} />;
    }
    case MarketStats.OpenInterest: {
      return (
        <$Output
          type={OutputType.Number}
          value={value}
          fractionDigits={useFiatDisplayUnit ? 0 : LARGE_TOKEN_DECIMALS}
          slotRight={
            <DisplayUnitTag tw="ml-[0.5ch]" assetId={assetId} entryPoint="openInterestAssetTag" />
          }
        />
      );
    }
    case MarketStats.Funding1H: {
      return (
        <WithTooltip
          slotTooltip={
            <dl>
              <dd tw="flex">
                {stringGetter({ key: STRING_KEYS.ANNUALIZED })}:
                <Output
                  tw="ml-0.25"
                  type={OutputType.Percent}
                  value={MustBigNumber(value).times(24 * 365)}
                  fractionDigits={0}
                />
              </dd>
            </dl>
          }
        >
          <$Output
            type={OutputType.Percent}
            value={value}
            color={!isLoading ? color : undefined}
            fractionDigits={FUNDING_DECIMALS}
          />
        </WithTooltip>
      );
    }
    case MarketStats.NextFunding: {
      return <NextFundingTimer />;
    }
    case MarketStats.PriceChange24H: {
      return (
        <$RowSpan color={!isLoading ? color : undefined}>
          {!isLoading && <TriangleIndicator value={valueBN} />}
          <$Output
            withSubscript
            type={OutputType.Fiat}
            value={valueBN.abs()}
            fractionDigits={tickSizeDecimals}
          />
          {!isLoading && (
            <$Output
              type={OutputType.Percent}
              value={MustBigNumber(priceChange24HPercent).abs()}
              withParentheses
            />
          )}
        </$RowSpan>
      );
    }
    case MarketStats.Trades24H: {
      return <$Output type={OutputType.Number} value={value} fractionDigits={0} />;
    }
    case MarketStats.Volume24H: {
      // $ with no decimals
      return <$Output type={OutputType.Fiat} value={value} fractionDigits={0} />;
    }
    default: {
      // Default renderer
      return <$Output type={OutputType.Text} value={value} />;
    }
  }
};

const $Header = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}

  ${layoutMixins.column}

  border-bottom: 1px solid var(--color-border);
`;

const $TopHeader = styled.header`
  ${layoutMixins.stickyHeader}
  z-index: 2;

  ${layoutMixins.row}

  padding-left: 1rem;
  padding-right: 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  gap: 1rem;

  justify-content: space-between;

  color: var(--color-text-2);
  background-color: var(--color-layer-2);

  border-bottom: 1px solid var(--color-border);
`;

const $StatsHeader = styled.div`
  @media ${breakpoints.notTablet} {
    ${layoutMixins.scrollArea}
    ${layoutMixins.row}
    isolation: isolate;

    align-items: stretch;
    margin-left: 1px;
  }

  @media ${breakpoints.tablet} {
    border-bottom: solid var(--border-width) var(--color-border);
  }
`;

const $Details = styled(Details)`
  font: var(--font-mini-book);

  @media ${breakpoints.tablet} {
    ${layoutMixins.withOuterAndInnerBorders}

    font: var(--font-small-book);

    > * {
      padding: 0.625rem 1rem;
    }
  }
`;

const $Right = styled.div`
  margin-left: auto;

  ${layoutMixins.rowColumn}
  justify-items: flex-end;
`;

const $Output = styled(Output)<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
`;

const $RowSpan = styled.span<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}

  > span {
    ${layoutMixins.row}
  }

  gap: 0.25rem;
`;
