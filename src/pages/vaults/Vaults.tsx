import { useState } from 'react';

import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';

import { useAppSelector } from '@/state/appTypes';
import { getUserVault } from '@/state/vaultSelectors';

import { FullVaultInfo, VaultTransactionsTable, YourVaultDetailsCards } from './FullVaultInfo';

const Vaults = () => {
  const stringGetter = useStringGetter();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.VAULT }));

  const [showHistory, setShowHistory] = useState(false);
  const transactions = useAppSelector(getUserVault)?.transactionHistory ?? EMPTY_ARR;
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
            <$HistoryCard>
              <$HistoryTitle>
                <$HistoryTitleText>
                  {stringGetter({ key: STRING_KEYS.DEPOSITS_AND_WITHDRAWALS })}
                  <$HistoryCount>{transactions.length}</$HistoryCount>
                </$HistoryTitleText>
                <$ShowHideHistoryButton
                  size={ButtonSize.XSmall}
                  shape={ButtonShape.Pill}
                  onClick={() => setShowHistory((o) => !o)}
                >
                  {showHistory
                    ? stringGetter({ key: STRING_KEYS.HIDE })
                    : stringGetter({ key: STRING_KEYS.VIEW })}
                </$ShowHideHistoryButton>
              </$HistoryTitle>
              {showHistory && <VaultTransactionsTable />}
            </$HistoryCard>
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
const VAULT_FORM_WIDTH_REM = 25;
const VAULT_DETAILS_WIDTH_REM = 30;
const $TwoColumnContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
  --vault-form-width: ${VAULT_FORM_WIDTH_REM}rem;
  --vault-details-width: ${VAULT_DETAILS_WIDTH_REM}rem;
  gap: 2.5rem;
  display: grid;
  grid-template-columns: 1fr var(--vault-form-width);

  @media (width <= ${VAULT_DETAILS_WIDTH_REM + VAULT_DETAILS_WIDTH_REM}rem) {
    grid-template-columns: 1fr;
  }
`;
const $VaultDetailsColumn = styled.div``;
const $VaultDepositWithdrawFormColumn = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
`;
const $PlaceholderBox = styled.div`
  width: 25rem;
  height: 22rem;
  border-radius: 0.7rem;
  background-color: var(--color-layer-3);
`;
const $HistoryCard = styled.div`
  border-radius: 0.7rem;
  border: 1px solid var(--color-border);
`;
const $HistoryCount = styled.span`
  margin-left: 0.5rem;
  color: var(--color-text-0);
`;
const $ShowHideHistoryButton = styled(Button)``;

const $HistoryTitle = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.625rem 1rem;
`;
const $HistoryTitleText = styled.h3`
  font: var(--font-base-medium);
  line-height: 1.75rem;
`;

export default Vaults;
