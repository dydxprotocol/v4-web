import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter, useURLConfigs } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';

import { openDialog } from '@/state/dialogs';

import { DYDXBalancePanel } from './DYDXBalancePanel';
import { MigratePanel } from './MigratePanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';

const RewardsPage = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { governanceLearnMore, stakingLearnMore } = useURLConfigs();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  const panelArrow = (
    <Styled.Arrow>
      <Styled.IconButton
        action={ButtonAction.Base}
        iconName={IconName.Arrow}
        size={ButtonSize.Small}
      />
    </Styled.Arrow>
  );

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

      <Styled.PanelRow>
        <Styled.Panel
          slotHeaderContent={
            <Styled.Title>{stringGetter({ key: STRING_KEYS.GOVERNANCE })}</Styled.Title>
          }
          slotRight={panelArrow}
          onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
        >
          <Styled.Description>
            {stringGetter({ key: STRING_KEYS.GOVERNANCE_DESCRIPTION })}
            <Link href={governanceLearnMore} onClick={(e) => e.stopPropagation()}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          </Styled.Description>
        </Styled.Panel>

        <Styled.Panel
          slotHeaderContent={
            <Styled.Title>{stringGetter({ key: STRING_KEYS.STAKING })}</Styled.Title>
          }
          slotRight={panelArrow}
          onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
        >
          <Styled.Description>
            {stringGetter({ key: STRING_KEYS.STAKING_DESCRIPTION })}
            <Link href={stakingLearnMore} onClick={(e) => e.stopPropagation()}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          </Styled.Description>
        </Styled.Panel>
      </Styled.PanelRow>

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

Styled.Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  margin-bottom: -1rem;
`;

Styled.Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
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

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

Styled.Arrow = styled.div`
  padding: 1rem;
`;
