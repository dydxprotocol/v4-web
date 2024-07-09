import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { HorizontalSeparatorFiller } from '@/components/Separator';

import { VaultHeader, VaultPositionsSection, YourVaultDetailsCards } from './VaultInfoSections';
import { VaultPnlChart } from './VaultPnlChart';
import { VaultTransactionsCard } from './VaultTransactions';

const Vaults = () => {
  const stringGetter = useStringGetter();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.VAULT }));

  const { isTablet } = useBreakpoints();
  if (isTablet) {
    // one column, reordered, static positioned deposit buttons
    return (
      <$Page>
        <$OneColumnContainer>
          <$VaultDetailsColumn>
            <$VaultHeader />
            <$YourVaultDetailsCards />
            <$VaultTransactionsCardContainer>
              <VaultTransactionsCard />
            </$VaultTransactionsCardContainer>
            <$PnlRow>
              <$PnlChart />
            </$PnlRow>
            <$VaultPositionsSection scroll />
          </$VaultDetailsColumn>
          {/* Todo: static buttons */}
        </$OneColumnContainer>
      </$Page>
    );
  }
  return (
    <$Page>
      <$TwoColumnContainer>
        <$VaultDetailsColumn>
          <$VaultHeader />
          <$HorizontalSeparatorFiller />
          <$PnlRow>
            <$PnlChart />
          </$PnlRow>
          <$HorizontalSeparatorFiller />
          <$VaultPositionsSection />
        </$VaultDetailsColumn>
        <$VaultDepositWithdrawFormColumn>
          <$YourVaultDetailsCards />
          <$DepositFormContainer>
            <$PlaceholderBox />
          </$DepositFormContainer>
          <$VaultTransactionsCardContainer>
            <VaultTransactionsCard />
          </$VaultTransactionsCardContainer>
        </$VaultDepositWithdrawFormColumn>
      </$TwoColumnContainer>
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
`;

const VAULT_FORM_WIDTH_REM = 25;
const VAULT_DETAILS_WIDTH_REM = 30;
const $OneColumnContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
  ${layoutMixins.column}
`;
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
const $VaultDetailsColumn = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
`;
const $VaultDepositWithdrawFormColumn = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
`;

const xPaddingWhenSmall = css`
  @media (${breakpoints.desktopSmall}) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;
const $VaultPositionsSection = styled(VaultPositionsSection)`
  > :first-child {
    ${xPaddingWhenSmall}
  }
`;
const $YourVaultDetailsCards = styled(YourVaultDetailsCards)`
  ${xPaddingWhenSmall}
`;
const $VaultTransactionsCardContainer = styled.div`
  ${xPaddingWhenSmall}
`;
const $DepositFormContainer = styled.div`
  ${xPaddingWhenSmall}
`;

const $PlaceholderBox = styled.div`
  height: 22rem;
  border-radius: 0.7rem;
  background-color: var(--color-layer-3);
`;

const $HorizontalSeparatorFiller = styled(HorizontalSeparatorFiller)`
  display: flex;
  min-height: 1px;
`;

const $PnlRow = styled.div`
  height: 30rem;
`;
const $PnlChart = styled(VaultPnlChart)`
  height: 30rem;
  background-color: var(--color-layer-2);

  // todo remember to grab colors
  --pnl-line-color: var(--color-positive);
`;

const $VaultHeader = styled(VaultHeader)`
  margin-bottom: 0.625rem;
  ${xPaddingWhenSmall}
`;

export default Vaults;
