import styled, { AnyStyledComponent } from 'styled-components';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { StakingPanel } from './rewards/StakingPanel';

export default () => {
  return (
    <Styled.Page>
      <ContentSectionHeader
        title="Staking Rewards"
        subtitle="Stake to earn APR. Unstaking can take up to 30 days."
      />
      <StakingPanel />
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
