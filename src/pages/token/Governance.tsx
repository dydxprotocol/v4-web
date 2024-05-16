import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { GovernancePanel } from './rewards/GovernancePanel';
import { NewMarketsPanel } from './rewards/NewMarketsPanel';

const Governance = () => {
  const stringGetter = useStringGetter();

  return (
    <DetachedSection>
      <$HeaderSection>
        <ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.GOVERNANCE })}
          subtitle={stringGetter({ key: STRING_KEYS.GOVERNANCE_PAGE_SUBTITLE })}
        />
      </$HeaderSection>

      <$ContentWrapper>
        <$Row>
          <GovernancePanel />
          <NewMarketsPanel />
        </$Row>
      </$ContentWrapper>
    </DetachedSection>
  );
};
export default Governance;

const $HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 0.5rem;
  }
`;

const $ContentWrapper = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;
  max-width: 80rem;
  padding: 0 1rem;
`;

const $Row = styled.div`
  gap: 1rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
`;
