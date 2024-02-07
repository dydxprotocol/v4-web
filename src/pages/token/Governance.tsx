import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { GovernancePanel } from './rewards/GovernancePanel';
import { NewMarketsPanel } from './rewards/NewMarketsPanel';

export default () => {
  const stringGetter = useStringGetter();

  return (
    <DetachedSection>
      <Styled.HeaderSection>
        <ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.GOVERNANCE })}
          subtitle="Participate in the ecosystem by voting on Governance proposals or submitting your own."
        />
      </Styled.HeaderSection>

      <Styled.ContentWrapper>
        <Styled.Row>
          <GovernancePanel />
          <NewMarketsPanel />
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
  grid-template-columns: repeat(3, 1fr);
`;
