import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Link } from '@/components/Link';

import { FullVaultInfo, VaultTransactionsTable } from './FullVaultInfo';

const Vaults = () => {
  const stringGetter = useStringGetter();
  const { vaultsLearnMore } = useURLConfigs();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.VAULTS_OVERVIEW }));

  return (
    <$Page>
      <$Container>
        <$TwoColumnContainer>
          <$VaultDetailsColumn>
            <FullVaultInfo />
          </$VaultDetailsColumn>
          <$VaultDepositWithdrawFormColumn>
            <$PlaceholderBox />
            <$HistoryRow>
              <$SectionTitle>
                {stringGetter({ key: STRING_KEYS.DEPOSITS_AND_WITHDRAWALS })}
              </$SectionTitle>
              <VaultTransactionsTable />
            </$HistoryRow>
          </$VaultDepositWithdrawFormColumn>
        </$TwoColumnContainer>
      </$Container>
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;

const $ContentSectionHeader = styled(ContentSectionHeader)`
  margin-top: 1rem;
  padding-top: 0;
  margin-bottom: 0;

  h3 {
    font: var(--font-extra-medium);
  }

  @media ${breakpoints.tablet} {
    margin-top: 0;
    padding: 1.25rem 1.5rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;
const $HeaderSubtitleContainer = styled.span`
  display: block;
  max-width: 34rem;
`;
const $HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  margin-bottom: 1.5rem;

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 1rem;
  }
`;

const $Link = styled(Link)`
  --link-color: var(--color-text-2);
  display: inline-block;
`;

const $Container = styled.div`
  padding: 1rem;
`;
const $NavHeader = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;
const $OverviewLink = styled(Link)`
  --link-color: var(--color-text-0);
`;

const $TwoColumnContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
  ${layoutMixins.flexEqualColumns}
  flex-wrap: wrap;
  gap: 2.5rem;
`;
const $VaultDetailsColumn = styled.div`
  min-width: 30rem;
`;
const $VaultDepositWithdrawFormColumn = styled.div`
  max-width: min-content;
`;
const $PlaceholderBox = styled.div`
  width: 25rem;
  height: 22rem;
  border-radius: 0.7rem;
  background-color: var(--color-layer-3);
`;
const $HistoryRow = styled.div``;

const $SectionTitle = styled.div`
  font: var(--font-large-medium);
  margin-bottom: 1rem;
`;

export default Vaults;
