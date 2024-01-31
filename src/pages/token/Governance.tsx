import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { GovernancePanel } from './rewards/GovernancePanel';
import { NewMarketsPanel } from './rewards/NewMarketsPanel';

export default () => {
  const stringGetter = useStringGetter();

  return (
    <Styled.Page>
      <ContentSectionHeader
        title={stringGetter({ key: STRING_KEYS.GOVERNANCE })}
        subtitle="Participate in the ecosystem by voting on Governance proposals or submitting your own."
      />
      <GovernancePanel />
      <NewMarketsPanel />
    </Styled.Page>
  );
};

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
