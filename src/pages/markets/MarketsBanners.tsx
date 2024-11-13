import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useLaunchableMarkets } from '@/hooks/useLaunchableMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { testFlags } from '@/lib/testFlags';

export const MarketsBanners = () => {
  const stringGetter = useStringGetter();
  const { data: launchableMarkets } = useLaunchableMarkets();
  const marketIds = useAppSelector(getMarketIds, shallowEqual);

  return testFlags.pml ? (
    <$PmlBanner to={AppRoute.LaunchMarket}>
      <img src="/affiliates-hedgie.png" alt="affiliates hedgie" tw="mt-1 h-5" />

      <div tw="mr-auto flex flex-col">
        <span tw="font-medium-medium">
          {stringGetter({ key: STRING_KEYS.INSTANT_MARKET_LISTINGS_ARE_LIVE })}
        </span>
        <span tw="text-color-text-0 font-base-book notTablet:text-nowrap">
          {stringGetter({ key: STRING_KEYS.LIST_ANY_MARKET })}
        </span>

        <$Details
          withSeparators
          layout="rowColumns"
          items={[
            {
              key: 'live',
              label: stringGetter({ key: STRING_KEYS.MARKETS }),
              value: <Output type={OutputType.CompactNumber} value={marketIds.length} />,
            },
            {
              key: 'launchable',
              label: stringGetter({ key: STRING_KEYS.LAUNCHABLE }),
              value: <Output type={OutputType.CompactNumber} value={launchableMarkets.length} />,
            },
          ]}
        />
      </div>

      <$StarsOverlay />

      <IconButton iconName={IconName.Arrow} />
    </$PmlBanner>
  ) : null;
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

  > :first-child {
    padding-left: 0;
  }
`;
