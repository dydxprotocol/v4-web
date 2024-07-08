import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { FullVaultInfo, VaultTransactionsTable, YourVaultDetailsCards } from './FullVaultInfo';

const Vaults = () => {
  const stringGetter = useStringGetter();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.VAULT }));

  return (
    <$Page>
      <$Container>
        <$TwoColumnContainer>
          <$VaultDetailsColumn>
            <FullVaultInfo />
          </$VaultDetailsColumn>
          <$VaultDepositWithdrawFormColumn>
            <$YourVaultDetailsCards />
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

const $YourVaultDetailsCards = styled(YourVaultDetailsCards)``;

const $Container = styled.div`
  padding: 1rem;
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
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
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
