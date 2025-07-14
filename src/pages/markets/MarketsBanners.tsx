import { RefObject, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
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
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setShouldHideLaunchableMarkets } from '@/state/appUiConfigs';
import { setHasDismissedPmlBanner, setHasDismissedPumpBanner } from '@/state/dismissable';
import { getHasDismissedPmlBanner, getHasDismissedPumpBanner } from '@/state/dismissableSelectors';
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
  const dispatch = useAppDispatch();

  const onDismissPmlBanner = () => {
    dispatch(setHasDismissedPmlBanner(true));
  };

  const onClickPmlBanner = () => {
    dispatch(setShouldHideLaunchableMarkets(false));
    dispatch(setMarketFilter(MarketFilters.LAUNCHABLE));
    marketsTableRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shouldDisplayPmlBanner = !hasDismissedPmlBanner;

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

  const hasDismissedPumpBanner = useAppSelector(getHasDismissedPumpBanner);
  const pumpMarketId = 'PUMP-USD';

  const navigate = useNavigate();

  const onDismissPumpBanner = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setHasDismissedPumpBanner(true));
  };

  const onClickPumpBanner = () => {
    navigate(`${AppRoute.Trade}/${pumpMarketId}`);
  };

  const shouldDisplayPumpBanner = !hasDismissedPumpBanner;

  const pumpBanner = shouldDisplayPumpBanner ? (
    <$PumpBanner onClick={onClickPumpBanner} role="button" tabIndex={0}>
      <div tw="mr-auto flex flex-col">
        <span tw="mb-0.25 text-white font-extra-bold">
          {stringGetter({
            key: STRING_KEYS.MARKET_LIVE,
            params: {
              MARKET: <span tw="text-color-accent">$PUMP</span>,
              LEVERAGE: '5',
            },
          })}
        </span>
        <Button action={ButtonAction.Primary} tw="max-w-10">
          {stringGetter({ key: STRING_KEYS.VIEW_MARKET })}
        </Button>
      </div>

      <img src="/pump-hedgie.png" alt="pump hedgie" tw="mr-2 h-14 mobile:hidden" />

      <IconButton
        tw="absolute right-0.5 top-0.5 border-none"
        iconName={IconName.Close}
        size={ButtonSize.XSmall}
        onClick={(e: React.MouseEvent<any>) => onDismissPumpBanner(e)}
      />
    </$PumpBanner>
  ) : null;

  return pumpBanner ?? pmlBanner ?? null;
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
  button {
    z-index: 1;
  }

  @media ${breakpoints.mobile} {
    height: 8rem;

    span {
      font: var(--font-small-book);
    }
  }
`;

const $PumpBanner = styled($MarketsPageBanner)`
  height: 8rem;
  img,
  span,
  button {
    z-index: 1;
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
