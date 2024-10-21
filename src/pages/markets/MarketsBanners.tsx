import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { PREDICTION_MARKET } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';
import { StatsigFlags } from '@/constants/statsig';

import { useAllStatsigGateValues } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { testFlags } from '@/lib/testFlags';

export const MarketsBanners = () => {
  const stringGetter = useStringGetter();
  const featureFlags = useAllStatsigGateValues();
  const now = Date.now();
  const trumpwinExpiration = new Date('2020-11-05T00:00:00Z').getTime();

  return (
    <>
      {testFlags.pml && (
        <$PmlBanner to={AppRoute.LaunchMarket}>
          <img src="/affiliates-hedgie.png" alt="affiliates hedgie" tw="mt-1 h-5" />

          <div tw="mr-auto flex flex-col">
            <span tw="font-medium-medium">
              {stringGetter({ key: STRING_KEYS.PERMISSIONLESS_LIVE })}
            </span>
            <span tw="text-color-text-0 font-base-book notTablet:text-nowrap">
              {stringGetter({ key: STRING_KEYS.INSTANTLY_LAUNCH_BY_DEPOSITING })}
            </span>
          </div>

          <$StarsOverlay />

          <IconButton iconName={IconName.Arrow} />
        </$PmlBanner>
      )}

      {featureFlags[StatsigFlags.ffShowPredictionMarketsUi] && now < trumpwinExpiration && (
        <$MarketsPageBanner to={`${AppRoute.Trade}/${PREDICTION_MARKET.TRUMPWIN}`}>
          <span>🇺🇸 {stringGetter({ key: STRING_KEYS.LEVERAGE_TRADE_US_ELECTION })}</span>
          <$FlagOverlay />
          <IconButton iconName={IconName.Arrow} />
        </$MarketsPageBanner>
      )}
    </>
  );
};

const $MarketsPageBanner = styled(Link)`
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

  span {
    font: var(--font-medium-medium);
  }

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

// Note: 573px; is the width of the flag image
const $FlagOverlay = styled.div`
  width: 573px;
  height: 100%;
  background-image: ${({ theme }) => `
    linear-gradient(90deg, ${theme.layer1} 0%, ${theme.tooltipBackground} 53%, ${theme.layer1} 99%),
    url('/AmericanFlag.png')
  `};
  background-repeat: no-repeat;

  @media ${breakpoints.mobile} {
    position: absolute;
    width: 100%;
    z-index: 0;
  }
`;

const $PmlBanner = styled($MarketsPageBanner)`
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
