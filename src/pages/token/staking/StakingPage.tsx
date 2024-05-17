import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { ValidatorsTable } from '@/views/tables/ValidatorsTable';

import { DYDXBalancePanel } from '../rewards/DYDXBalancePanel';
import { StakingPanel } from './StakingPanel';
import { StrideStakingPanel } from './StrideStakingPanel';

export default () => {
  const stringGetter = useStringGetter();
  return (
    <DetachedSection>
      <Styled.HeaderSection>
        <ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.STAKING_REWARDS })}
          subtitle={stringGetter({ key: STRING_KEYS.STAKING_PAGE_SUBTITLE })}
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
        <Styled.TableWrapper>
          <ValidatorsTable />
        </Styled.TableWrapper>
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

Styled.TableWrapper = styled.div``;
