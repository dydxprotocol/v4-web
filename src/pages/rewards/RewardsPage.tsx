import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { ButtonAction, ButtonSize } from '@/constants/buttons';

import { useAccounts, useBreakpoints, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { DYDXBalancePanel } from './DYDXBalancePanel';

export const RewardsPage = () => {
  const stringGetter = useStringGetter();

  return (
    <Styled.Page>
      <Styled.PanelRow>
        <Styled.Panel
          slotHeader={<Styled.Title>{stringGetter({ key: STRING_KEYS.GOVERNANCE })}</Styled.Title>}
        >
          <Styled.Row>
            <div>
              {stringGetter({ key: STRING_KEYS.GOVERNANCE_DESCRIPTION })}
            </div>
            <IconButton action={ButtonAction.Base} iconName={IconName.Arrow} size={ButtonSize.Small} />
          </Styled.Row>
        </Styled.Panel>
        <Styled.Panel
          slotHeader={<Styled.Title>{stringGetter({ key: STRING_KEYS.STAKING })}</Styled.Title>}
        >
          <Styled.Row>
            <div>
              {stringGetter({ key: STRING_KEYS.STAKING_DESCRIPTION })}
            </div>
            <IconButton action={ButtonAction.Base} iconName={IconName.Arrow} size={ButtonSize.Small} />
          </Styled.Row>
        </Styled.Panel>
        <Styled.BalancePanelContainer>
          <DYDXBalancePanel />
        </Styled.BalancePanelContainer>
      </Styled.PanelRow>
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;

Styled.Row = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1rem;
`;

Styled.PanelRow = styled(Styled.Row)`
  gap: 1.5rem;
  max-width: min(100vw, var(--content-max-width));
  align-items: flex-start;
`;

Styled.BalancePanelContainer = styled.div`
  max-width: 21.25rem;
`;

Styled.Title = styled.h3`
  ${layoutMixins.inlineRow}
  padding: 1.25rem 1.5rem 0.5rem;

  font: var(--font-medium-book);
  color: var(--color-text-2);
`;

Styled.Panel = styled(Panel)`
  padding: 0 1.5rem 1rem;
`
