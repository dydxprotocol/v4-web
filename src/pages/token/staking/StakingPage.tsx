import styled, { AnyStyledComponent } from 'styled-components';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { StakingPanel } from './StakingPanel';
import { StrideStakingPanel } from './StrideStakingPanel';
import { DYDXBalancePanel } from '../rewards/DYDXBalancePanel';

export default () => {
  return (
    <DetachedSection>
      <Styled.HeaderSection>
        <ContentSectionHeader
          title="Staking Rewards"
          subtitle="Stake to earn APR. Unstaking can take up to 30 days."
        />
      </Styled.HeaderSection>

      <Styled.ContentWrapper>
        <Styled.Row>
          <Styled.InnerRow>
            <StrideStakingPanel />
            <StakingPanel />
          </Styled.InnerRow>
          <DYDXBalancePanel />
        </Styled.Row>
      </Styled.ContentWrapper>
    </DetachedSection>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 0.5rem;
  }
`;

Styled.ContentWrapper = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;
  max-width: 80rem;
  padding: 0 1rem;
`;

Styled.Row = styled.div`
  gap: 1rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
`;

Styled.InnerRow = styled.div`
  gap: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: fit-content;
`;
