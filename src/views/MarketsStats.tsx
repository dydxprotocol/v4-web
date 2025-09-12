import styled from 'styled-components';
import tw from 'twin.macro';

import { OnboardingState } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting } from '@/constants/markets';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { NewTag } from '@/components/Tag';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/analytics';

import { ExchangeBillboards } from './ExchangeBillboards';
import { MarketsCompactTable } from './tables/MarketsCompactTable';

interface MarketsStatsProps {
  className?: string;
}

export const MarketsStats = (props: MarketsStatsProps) => {
  const { className } = props;
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const onboardingState = useAppSelector(getOnboardingState);

  const { hasResults: hasNewMarkets } = useMarketsData({
    filter: MarketFilters.NEW,
    forceHideUnlaunchedMarkets: true,
  });

  const { isTablet } = useBreakpoints();

  const handleFreeDepositClick = () => {
    // Track analytics event
    track(
      AnalyticsEvents.MarketingBannerClick({
        source: 'markets',
        campaign: '04092025-markets-deposits-banner-modal',
        timestamp: Date.now(),
      })
    );

    // Check if user is fully onboarded/connected
    if (onboardingState === OnboardingState.AccountConnected) {
      // Open deposit dialog for connected users
      dispatch(openDialog(DialogTypes.Deposit2()));
    } else {
      // Open onboarding dialog for disconnected users
      dispatch(openDialog(DialogTypes.Onboarding()));
    }
  };
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
      <$FreeDepositBanner>
        <div tw="flex items-center justify-between gap-0.75">
          <div tw="relative z-10 mr-auto flex max-w-10 flex-col">
            <span tw="mb-0.75 leading-[1.2] font-extra-large-bold">
              <span tw="mr-0.25 rounded-0 bg-color-layer-1 px-0.25 text-color-accent">
                {stringGetter({ key: STRING_KEYS.FREE_DEPOSIT_BANNER_TITLE_FREE })}
              </span>
              <span tw="text-color-text-2">
                {stringGetter({ key: STRING_KEYS.FREE_DEPOSIT_BANNER_TITLE_AND })}
              </span>
            </span>
            <div tw="mt-0.5 flex flex-col gap-0.25">
              <Button
                action={ButtonAction.Secondary}
                type={ButtonType.Button}
                tw="relative z-10 w-full border-none bg-color-layer-0 text-color-text-2"
                onClick={handleFreeDepositClick}
              >
                {stringGetter({ key: STRING_KEYS.FREE_DEPOSIT_BANNER_CTA })}
              </Button>
              <span tw="text-color-text-2 font-mini-book">
                {stringGetter({ key: STRING_KEYS.FREE_DEPOSIT_BANNER_SUBTITLE })}
              </span>
            </div>
          </div>

          <img
            src="/free-deposit-hedgie.png"
            alt="free deposit hedgie"
            tw="absolute bottom-0 left-7 z-0 h-14 object-contain mobile:hidden"
          />
        </div>
      </$FreeDepositBanner>
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

const $FreeDepositBanner = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 0.625rem;
  background: var(--color-accent);
  position: relative;
  overflow: hidden;
  padding: 1.25rem;

  img,
  span,
  button,
  a {
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(
        circle at 20% 20%,
        rgba(255, 255, 255, 0.1) 1px,
        transparent 1px
      ),
      radial-gradient(circle at 60% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 40%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size:
      50px 50px,
      30px 30px,
      40px 40px;
    animation: confetti 20s linear infinite;
    z-index: 0;
  }

  @keyframes confetti {
    0% {
      transform: translateY(0) rotate(0deg);
    }
    100% {
      transform: translateY(-100vh) rotate(360deg);
    }
  }

  @media ${breakpoints.tablet} {
    padding: 1rem;

    span {
      font: var(--font-small-book);
    }
  }
`;
