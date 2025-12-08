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
      <$LiquidationRebatesBanner>
        <div tw="z-[1] flex max-w-[65%] flex-col gap-2">
          <span tw="text-white font-extra-bold">
            {stringGetter({ key: STRING_KEYS.LIQUIDATION_REBATES_BANNER_TITLE })}
          </span>
          <Button
            action={ButtonAction.Primary}
            type={ButtonType.Link}
            href="https://dydx.trade/DYDX"
            tw="self-start"
          >
            {stringGetter({ key: STRING_KEYS.LIQUIDATION_REBATES_BANNER_CTA })}
          </Button>
        </div>
      </$LiquidationRebatesBanner>
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

const $LiquidationRebatesBanner = styled.div`
  background-image: url('/liquidation.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  display: grid;
  border-radius: 0.625rem;
`;
