import { useMemo, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { PREDICTION_MARKET } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';
import { StatSigFlags } from '@/constants/statsig';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useAllStatsigGateValues } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Switch } from '@/components/Switch';
import { MarketsStats } from '@/views/MarketsStats';
import { MarketsTable } from '@/views/tables/MarketsTable';

const Markets = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const featureFlags = useAllStatsigGateValues();
  const [showHighlights, setShowHighlights] = useState(true);
  const { hasPotentialMarketsData } = usePotentialMarkets();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.MARKETS }));

  const marketsPageBanner = useMemo(() => {
    if (featureFlags?.[StatSigFlags.ffShowPredictionMarketsUi]) {
      return (
        <$MarketsPageBanner to={`${AppRoute.Trade}/${PREDICTION_MARKET.TRUMPWIN}`}>
          <span>🇺🇸 {stringGetter({ key: STRING_KEYS.LEVERAGE_TRADE_US_ELECTION })}</span>
          <$FlagOverlay />
          <IconButton iconName={IconName.Arrow} />
        </$MarketsPageBanner>
      );
    }
    return null;
  }, [featureFlags, stringGetter]);

  return (
    <$Page>
      <$HeaderSection>
        <$ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.MARKETS })}
          slotRight={
            hasPotentialMarketsData && (
              <Button
                action={ButtonAction.Primary}
                onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
              >
                {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
              </Button>
            )
          }
        />
        {marketsPageBanner}
        <$Highlights htmlFor="highlights">
          {stringGetter({ key: STRING_KEYS.HIDE })}

          <Switch name="highlights" checked={showHighlights} onCheckedChange={setShowHighlights} />
        </$Highlights>

        <$MarketsStats showHighlights={showHighlights} />
      </$HeaderSection>

      <$MarketsTable />
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;
const $ContentSectionHeader = styled(ContentSectionHeader)`
  margin-top: 1rem;
  padding-top: 0;
  margin-bottom: 0;

  h3 {
    font: var(--font-extra-medium);
  }

  @media ${breakpoints.tablet} {
    margin-top: 0;
    padding: 1.25rem 1.5rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;

const $HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  margin-bottom: 1.5rem;

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 1rem;
  }
`;

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

const $MarketsTable = styled(MarketsTable)`
  ${layoutMixins.contentSectionAttached}
`;

const $MarketsStats = styled(MarketsStats)<{
  showHighlights?: boolean;
}>`
  ${({ showHighlights }) => !showHighlights && 'display: none;'}
`;

const $Highlights = styled.label`
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  display: none;
  cursor: pointer;

  @media ${breakpoints.desktopSmall} {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  @media ${breakpoints.tablet} {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    margin-bottom: 0;
    display: flex;
  }
`;

export default Markets;
