import { RefObject, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setShouldHideLaunchableMarkets } from '@/state/appUiConfigs';
import {
  setHasDismissedNoFeeBanner,
  setHasDismissedPmlBanner,
  setHasDismissedRebateBanner,
} from '@/state/dismissable';
import {
  getHasDismissedNoFeeBanner,
  getHasDismissedPmlBanner,
  getHasDismissedRebateBanner,
} from '@/state/dismissableSelectors';
import { setMarketFilter } from '@/state/perpetuals';

export const MarketsBanners = ({
  marketsTableRef,
}: {
  marketsTableRef?: RefObject<HTMLDivElement>;
}) => {
  const stringGetter = useStringGetter();
  const allMarkets = useMarketsData({
    filter: MarketFilters.ALL,
    forceShowUnlaunchedMarkets: true,
  }).markets;
  const launchable = useMemo(() => allMarkets.filter((f) => f.isUnlaunched), [allMarkets]);
  const launched = useMemo(() => allMarkets.filter((f) => !f.isUnlaunched), [allMarkets]);
  const { isMobile } = useBreakpoints();
  const hasDismissedPmlBanner = useAppSelector(getHasDismissedPmlBanner);
  const hasDismissedRebateBanner = useAppSelector(getHasDismissedRebateBanner);
  const hasDismissedNoFeeBanner = useAppSelector(getHasDismissedNoFeeBanner);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onDismissPmlBanner = () => {
    dispatch(setHasDismissedPmlBanner(true));
  };

  const onDismissRebateBanner = () => {
    dispatch(setHasDismissedRebateBanner(true));
  };

  const onDismissNoFeeBanner = () => {
    dispatch(setHasDismissedNoFeeBanner(true));
  };

  const onClickPmlBanner = () => {
    dispatch(setShouldHideLaunchableMarkets(false));
    dispatch(setMarketFilter(MarketFilters.LAUNCHABLE));
    marketsTableRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onClickNoFeeBanner = () => {
    navigate(`${AppRoute.Trade}/BTC-USD`);
  };

  const shouldDisplayPmlBanner = !hasDismissedPmlBanner;
  const shouldDisplayRebateBanner = !hasDismissedRebateBanner;
  const shouldDisplayNoFeeBanner = !hasDismissedNoFeeBanner;

  const pmlBanner = shouldDisplayPmlBanner ? (
    <$PmlBanner onClick={onClickPmlBanner} role="button" tabIndex={0}>
      <img src="/affiliates-hedgie.png" alt="affiliates hedgie" tw="h-8 mobile:hidden" />

      <div tw="mr-auto flex flex-col">
        <span tw="font-medium-medium">
          {stringGetter({ key: STRING_KEYS.INSTANT_MARKET_LISTINGS_ARE_LIVE })}
        </span>
        <span tw="text-color-text-0 font-base-book notTablet:text-nowrap">
          {stringGetter({ key: STRING_KEYS.LIST_ANY_MARKET })}
        </span>
      </div>

      {!isMobile && (
        <$Details
          withSeparators
          layout="rowColumns"
          items={[
            {
              key: 'live',
              label: (
                <span tw="text-color-text-2">{stringGetter({ key: STRING_KEYS.MARKETS })}</span>
              ),
              value: <Output type={OutputType.CompactNumber} value={launched.length} />,
            },
            {
              key: 'launchable',
              label: (
                <span tw="text-color-text-2">{stringGetter({ key: STRING_KEYS.LAUNCHABLE })}</span>
              ),
              value: <Output type={OutputType.CompactNumber} value={launchable.length} />,
            },
          ]}
        />
      )}

      <$StarsOverlay />

      <IconButton
        tw="absolute right-0.5 top-0.5 border-none"
        iconName={IconName.Close}
        size={ButtonSize.XSmall}
        onClick={onDismissPmlBanner}
      />
    </$PmlBanner>
  ) : null;

  const rebateBanner = shouldDisplayRebateBanner ? (
    <$RebateBanner>
      <div tw="mr-auto flex h-full flex-col justify-center">
        <span tw="mb-0.75 text-large font-extra-large-bold">
          <span tw="mr-0.25 rounded-0 px-0.25 text-color-accent">
            {stringGetter({ key: STRING_KEYS.REBATE_BANNER_TITLE_SURGE })}
          </span>
          <span tw="text-color-text-2">
            {stringGetter({ key: STRING_KEYS.REBATE_BANNER_TITLE_FEES })}
          </span>
        </span>
        <div tw="flex items-center gap-1.5">
          <Button
            action={ButtonAction.Primary}
            type={ButtonType.Link}
            href="https://dydx.trade/DYDX?utm_source=markets&utm_medium=markets-banner&utm_campaign=02092025-markets-surge-banner-dydx&utm_term=&utm_content=surge-banner"
            tw="relative z-10 w-12"
          >
            {stringGetter({ key: STRING_KEYS.GET_STARTED })}
          </Button>
        </div>
      </div>

      <img
        src="/hedgiepercentage.png"
        alt="rebate rewards hedgies"
        tw="absolute right-0 top-0 h-full object-contain mobile:hidden"
      />

      <IconButton
        tw="absolute right-0.5 top-0.5 border-none"
        iconName={IconName.Close}
        size={ButtonSize.XSmall}
        onClick={onDismissRebateBanner}
      />
    </$RebateBanner>
  ) : null;

  const noFeeBanner = shouldDisplayNoFeeBanner ? (
    <$NoFeeBanner>
      <img src="/no-fee-banner-hedgie.png" alt="Hedgie" tw="block h-[150%]" />
      <img
        src="/no-fee-banner-coins.png"
        alt="Coins"
        tw="pointer-events-none absolute right-7 h-[200%] object-contain"
      />
      <div tw="z-[1] ml-1 mr-auto flex flex-col items-start">
        <span tw="text-large text-white font-extra-bold">
          <span tw="mr-0.25 rounded-[0.25rem] bg-color-accent px-0.25">
            {stringGetter({ key: STRING_KEYS.NO_FEE_NOVEMBER_BANNER_TITLE_ACCENT })}
          </span>{' '}
          {stringGetter({ key: STRING_KEYS.NO_FEE_DECEMBER_BANNER_TITLE })}
        </span>
        <Link isAccent onClick={onClickNoFeeBanner} tw="font-base-medium">
          {stringGetter({ key: STRING_KEYS.NO_FEE_NOVEMBER_BANNER_CTA })} →
        </Link>
      </div>
      <IconButton
        tw="absolute right-0.5 top-0.5 border-none"
        iconName={IconName.Close}
        size={ButtonSize.XSmall}
        onClick={onDismissNoFeeBanner}
      />
    </$NoFeeBanner>
  ) : null;

  return noFeeBanner ?? rebateBanner ?? pmlBanner ?? null;
};

const $MarketsPageBanner = styled.div`
  ${layoutMixins.row}
  height: 5rem;
  border-radius: 10px;
  background-color: var(--color-layer-1);
  margin-bottom: 1rem;
  padding: 0 1.5rem;
  justify-content: space-between;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  @media ${breakpoints.desktopSmall} {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  @media ${breakpoints.tablet} {
    span,
    button {
      z-index: 1;
    }
  }
`;

const $PmlBanner = styled($MarketsPageBanner)`
  height: 8rem;
  img,
  span,
  button,
  a {
    z-index: 1;
  }

  @media ${breakpoints.mobile} {
    height: 8rem;

    span {
      font: var(--font-small-book);
    }
  }
`;

const $StarsOverlay = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 50%;
  background: var(--color-layer-0) url('/stars-background.png');
  mix-blend-mode: difference;
  z-index: 0;
`;

const $Details = styled(Details)`
  color: var(--color-text-2);
  z-index: 1;
  margin-top: 0.5rem;
  margin-right: auto;

  > :first-child {
    padding-left: 0;
  }
`;

const $RebateBanner = styled($MarketsPageBanner)`
  height: 8rem;
  background: var(--color-layer-1);
  position: relative;

  img,
  span,
  button,
  a {
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 80%;
    height: 130%;
    background: radial-gradient(ellipse at bottom right, var(--color-accent) 0%, transparent 70%);
    opacity: 0.6;
    z-index: 0;
  }

  @media ${breakpoints.mobile} {
    height: 8rem;

    span {
      font: var(--font-small-book);
    }
  }
`;

const $NoFeeBanner = styled($MarketsPageBanner)`
  position: relative;
  height: 8rem;
  overflow: hidden;
  background-image:
    url('/no-fee-banner-dots.png'), linear-gradient(90.59deg, #141528 17.91%, #18181f 82.09%);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
`;
