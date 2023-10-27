import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';

import { openDialog } from '@/state/dialogs';

import { DYDXBalancePanel } from './DYDXBalancePanel';
import { MigratePanel } from './MigratePanel';

// TODO: consolidate help link urls to env variables
const GOVERNANCE_HELP_URL = 'https://help.dydx.exchange/';
const STAKING_HELP_URL =
  'https://docs.dydx.community/dydx-chain-documentation/staking/how-to-stake';

export const RewardsPage = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const { isTablet, isNotTablet } = useBreakpoints();

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
      {import.meta.env.VITE_V3_TOKEN_ADDRESS && <MigratePanel />}
      <Styled.PanelRow>
        {isTablet && (
          <Styled.BalancePanelContainer>
            <DYDXBalancePanel />
          </Styled.BalancePanelContainer>
        )}

        <Styled.Panel
          slotHeader={<Styled.Title>{stringGetter({ key: STRING_KEYS.GOVERNANCE })}</Styled.Title>}
          slotRight={panelArrow}
          onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
        >
          <Styled.Description>
            {stringGetter({ key: STRING_KEYS.GOVERNANCE_DESCRIPTION })}
            <Link href={GOVERNANCE_HELP_URL} onClick={(e) => e.stopPropagation()}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          </Styled.Description>
        </Styled.Panel>

        <Styled.Panel
          slotHeader={<Styled.Title>{stringGetter({ key: STRING_KEYS.STAKING })}</Styled.Title>}
          slotRight={panelArrow}
          onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
        >
          <Styled.Description>
            {stringGetter({ key: STRING_KEYS.STAKING_DESCRIPTION })}
            <Link href={STAKING_HELP_URL} onClick={(e) => e.stopPropagation()}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
            </Link>
          </Styled.Description>
        </Styled.Panel>

        {isNotTablet && (
          <Styled.BalancePanelContainer>
            <DYDXBalancePanel />
          </Styled.BalancePanelContainer>
        )}
      </Styled.PanelRow>
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;
`;

Styled.Panel = styled(Panel)`
  padding: 1rem 1.5rem;
`;

Styled.Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  padding: 1rem 1.5rem 0;
`;

Styled.Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);
`;

Styled.PanelRow = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1.5rem;
  max-width: min(100vw, var(--content-max-width));
  align-items: flex-start;

  > section {
    cursor: pointer;
  }

  @media ${breakpoints.tablet} {
    grid-auto-flow: row;
    grid-template-columns: 1fr;
    max-width: auto;
  }
`;

Styled.BalancePanelContainer = styled.div`
  width: 21.25rem;

  @media ${breakpoints.tablet} {
    width: auto;
  }
`;

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

Styled.Arrow = styled.div`
  padding: 1rem 1.5rem;
`;
