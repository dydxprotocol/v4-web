import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { Panel } from '@/components/Panel';

import { DYDXBalancePanel } from './DYDXBalancePanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { MigratePanel } from './MigratePanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  return (
    <Styled.Page>
      {isTablet && (
        <Styled.MobileHeader>
          <BackButton onClick={() => navigate(AppRoute.Profile)} />
          {stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
        </Styled.MobileHeader>
      )}
      {import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet && <MigratePanel />}

      {isTablet ? (
        <LaunchIncentivesPanel />
      ) : (
        <Styled.PanelRowIncentivesAndBalance>
          <LaunchIncentivesPanel />
          <DYDXBalancePanel />
        </Styled.PanelRowIncentivesAndBalance>
      )}

      <RewardsHelpPanel />
    </Styled.Page>
  );
};

export default RewardsPage;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;
  padding: 2rem;
  align-items: center;

  > * {
    --content-max-width: 80rem;
    max-width: min(calc(100vw - 4rem), var(--content-max-width));
  }

  @media ${breakpoints.tablet} {
    --stickyArea-topHeight: var(--page-header-height-mobile);
    padding: 0 1rem 1rem;

    > * {
      max-width: calc(100vw - 2rem);
      width: 100%;
    }
  }
`;

Styled.MobileHeader = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}
  ${layoutMixins.stickyHeader}
  z-index: 2;
  padding: 1.25rem 0;
  margin-bottom: -1.5rem;

  font: var(--font-large-medium);
  color: var(--color-text-2);
  background-color: var(--color-layer-2);
`;

Styled.Panel = styled(Panel)`
  height: fit-content;
`;

Styled.PanelRow = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: 1.5rem;

  @media ${breakpoints.tablet} {
    grid-auto-flow: row;
    grid-template-columns: 1fr;
  }
`;

Styled.PanelRowIncentivesAndBalance = styled(Styled.PanelRow)`
  grid-template-columns: 2fr 1fr;
`;
