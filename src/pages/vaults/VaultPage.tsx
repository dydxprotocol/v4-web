import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { HorizontalSeparatorFiller } from '@/components/Separator';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { VaultDepositWithdrawForm } from './VaultDepositWithdrawForm';
import {
  VaultDescription,
  VaultHeader,
  VaultPositionsSection,
  YourVaultDetailsCards,
} from './VaultInfoSections';
import { VaultLockedSharesCard } from './VaultLockedSharesTable';
import { VaultPnlChart } from './VaultPnlChart';
import { VaultTransactionsCard } from './VaultTransactions';

const VaultPage = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  useDocumentTitle(stringGetter({ key: STRING_KEYS.MEGAVAULT }));

  const { isTablet } = useBreakpoints();

  if (isTablet) {
    // one column, reordered, static positioned deposit buttons
    return (
      <$MobilePage>
        <$VaultHeaderMobile />

        <$OneColumnContainer>
          <$VaultDetailsColumn>
            <$YourVaultDetailsCards />
            <$VaultTransactionsCardContainer>
              <VaultLockedSharesCard />
            </$VaultTransactionsCardContainer>
            <$VaultTransactionsCardContainer>
              <VaultTransactionsCard />
            </$VaultTransactionsCardContainer>
            <$HorizontalSeparatorFiller />
            <$PnlRow>
              <$PnlChart />
            </$PnlRow>
            <$VaultDescription />
            <$VaultPositionsSection />
          </$VaultDetailsColumn>
        </$OneColumnContainer>

        <$MobileFooter>
          <Button
            type={ButtonType.Button}
            action={ButtonAction.Primary}
            slotLeft={<Icon iconName={IconName.Deposit} />}
            onClick={() =>
              dispatch(openDialog(DialogTypes.VaultDepositWithdraw({ initialType: 'DEPOSIT' })))
            }
          >
            {stringGetter({ key: STRING_KEYS.DEPOSIT })}
          </Button>
          <Button
            type={ButtonType.Button}
            action={ButtonAction.Secondary}
            slotLeft={<Icon iconName={IconName.Withdraw} />}
            onClick={() =>
              dispatch(openDialog(DialogTypes.VaultDepositWithdraw({ initialType: 'WITHDRAW' })))
            }
          >
            {stringGetter({ key: STRING_KEYS.WITHDRAW })}
          </Button>
        </$MobileFooter>
      </$MobilePage>
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
          <$VaultDescription />
          <$VaultPositionsSection />
        </$VaultDetailsColumn>
        <div tw="flexColumn gap-1.25">
          <$YourVaultDetailsCards />
          <$DepositFormContainer>
            <div tw="rounded-[0.7rem] bg-color-layer-3">
              <VaultDepositWithdrawForm />
            </div>
          </$DepositFormContainer>
          <VaultLockedSharesCard />
          <$VaultTransactionsCardContainer>
            <VaultTransactionsCard />
          </$VaultTransactionsCardContainer>
        </div>
      </$TwoColumnContainer>
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
`;

const $MobilePage = styled.div`
  ${layoutMixins.contentContainerPage}
  ${layoutMixins.stickyArea1}
  --stickyArea1-topHeight: 4.75rem;
  --stickyArea1-bottomHeight: var(--page-footer-height-mobile);
  ${layoutMixins.withInnerHorizontalBorders}
`;
const $OneColumnContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
  ${layoutMixins.column}
  flex: 1;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
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
const $VaultDetailsColumn = tw.div`flexColumn gap-1.25`;
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
const $VaultDescription = styled(VaultDescription)`
  ${xPaddingWhenSmall}
`;
const $HorizontalSeparatorFiller = tw(HorizontalSeparatorFiller)`flex min-h-px max-h-px`;

const $PnlRow = styled.div``;
const $PnlChart = styled(VaultPnlChart)``;

const $VaultHeader = styled(VaultHeader)`
  ${xPaddingWhenSmall}
`;
const $VaultHeaderMobile = styled(VaultHeader)`
  ${layoutMixins.contentSectionDetachedScrollable}
  ${layoutMixins.stickyHeader}
  padding-top: .5rem;
  padding-bottom: 0.5rem;
  z-index: 2;
  background-color: var(--color-layer-2);
`;
const $MobileFooter = styled.div`
  ${layoutMixins.stickyFooter}
  ${layoutMixins.flexEqualRow}
  background-color: var(--color-layer-2);
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
`;

export default VaultPage;
