import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { DYDXBalancePanel } from '../rewards/DYDXBalancePanel';
import { StakingPanel } from './StakingPanel';
import { StrideStakingPanel } from './StrideStakingPanel';

const StakingPage = () => {
  const stringGetter = useStringGetter();
  return (
    <DetachedSection>
      <$HeaderSection>
        <ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.STAKING_REWARDS })}
          subtitle={stringGetter({ key: STRING_KEYS.STAKING_PAGE_SUBTITLE })}
        />
      </$HeaderSection>

      <$ContentWrapper>
        <$Row>
          <$InnerRow>
            <StrideStakingPanel />
            <StakingPanel />
          </$InnerRow>
          <DYDXBalancePanel />
        </$Row>
      </$ContentWrapper>
    </DetachedSection>
  );
};
export default StakingPage;

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
  grid-template-columns: 2fr 1fr;
`;

const $InnerRow = styled.div`
  gap: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: fit-content;
`;
