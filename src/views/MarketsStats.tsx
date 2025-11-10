import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting } from '@/constants/markets';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { NewTag } from '@/components/Tag';

import { ExchangeBillboards } from './ExchangeBillboards';
import { MarketsCompactTable } from './tables/MarketsCompactTable';

interface MarketsStatsProps {
  className?: string;
}

export const MarketsStats = (props: MarketsStatsProps) => {
  const { className } = props;
  const stringGetter = useStringGetter();

  const { hasResults: hasNewMarkets } = useMarketsData({
    filter: MarketFilters.NEW,
    forceHideUnlaunchedMarkets: true,
  });

  const { isTablet } = useBreakpoints();

  return (
    <section
      className={className}
      tw="grid auto-cols-fr grid-flow-col gap-1 tablet:column desktopSmall:pl-1 desktopSmall:pr-1"
    >
      {!isTablet && <ExchangeBillboards />}
      {hasNewMarkets && (
        <$Section>
          <$SectionHeader>
            <h4 tw="flex items-center gap-0.375">
              {stringGetter({ key: STRING_KEYS.RECENTLY_LISTED })}
              <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
            </h4>
          </$SectionHeader>
          <MarketsCompactTable sorting={MarketSorting.RECENTLY_LISTED} />
        </$Section>
      )}
      <$TradingLeaguesBanner>
        <img
          src="/trading-league.svg"
          alt="Trading League trophy"
          tw="pointer-events-none absolute right-[5%] top-[5%] h-[90%] opacity-60"
        />
        <div tw="z-[1] flex max-w-[80%] flex-col justify-between">
          <div tw="flex flex-col gap-[0.75rem]">
            <span tw="text-large text-white font-large-bold">
              {stringGetter({ key: STRING_KEYS.TRADING_LEAGUES_BANNER_TITLE })}{' '}
              <$ActiveTag>{stringGetter({ key: STRING_KEYS.ACTIVE })}</$ActiveTag>
            </span>
            <span tw="text-color-accent font-small-medium">
              {stringGetter({ key: STRING_KEYS.TRADING_LEAGUES_BANNER_SUBTITLE })}
            </span>
          </div>
          <Button
            action={ButtonAction.Primary}
            type={ButtonType.Link}
            href="https://dydx.trade/dydx?utm_source=markets&utm_medium=ui&utm_campaign=01112025-markets-leagues-dydx&utm_term=&utm_content=markets-banner"
            tw="self-start"
          >
            {stringGetter({ key: STRING_KEYS.TRADING_LEAGUES_BANNER_CTA })}
          </Button>
        </div>
      </$TradingLeaguesBanner>
    </section>
  );
};

const $Section = tw.div`grid grid-rows-[auto_1fr] rounded-0.625 bg-color-layer-3`;

const $SectionHeader = styled.div`
  ${layoutMixins.row}
  position: relative;

  padding: 1.25rem;
  gap: 0.25rem;

  & h4 {
    font: var(--font-base-medium);
    color: var(--color-text-2);
  }

  @media ${breakpoints.tablet} {
    padding: 1rem;
  }
`;

const $TradingLeaguesBanner = styled.div`
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/trading-league-banner-bg.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  display: grid;
  border-radius: 0.625rem;
`;

const $ActiveTag = styled.span`
  border-radius: 0.5rem;
  border: 1px solid;
  border-color: var(--color-positive);
  background-color: color-mix(in srgb, var(--color-positive) 12%, transparent);
  padding: 0.1875rem 0.375rem;
  color: var(--color-positive);
  font: var(--font-mini-bold);
  vertical-align: middle;
  display: inline-block;
  transform: translateY(-2px);
`;
