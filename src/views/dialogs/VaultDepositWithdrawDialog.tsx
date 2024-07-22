import { useCallback, useEffect } from 'react';

import styled from 'styled-components';

import { DialogProps, VaultDepositWithdrawDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { VaultDepositWithdrawForm } from '@/pages/vaults/VaultDepositWithdrawForm';

export const VaultDepositWithdrawDialog = ({
  setIsOpen,
  initialType,
}: DialogProps<VaultDepositWithdrawDialogProps>) => {
  const stringGetter = useStringGetter();
  const { isMobile, isTablet } = useBreakpoints();

  const closeDialog = useCallback(() => setIsOpen?.(false), [setIsOpen]);

  useEffect(() => {
    if (!isTablet) {
      closeDialog();
    }
  }, [closeDialog, isTablet]);

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
      title={
        <$VaultDialogTitle>
          <$VaultImg src="/dydx-chain.png" />
          {stringGetter({ key: STRING_KEYS.VAULT })}
        </$VaultDialogTitle>
      }
      hasHeaderBorder
    >
      <VaultDepositWithdrawForm initialType={initialType} onSuccess={closeDialog} />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
`;

const $VaultImg = styled.img`
  width: 2.5rem;
  height: 2.5rem;
`;

const $VaultDialogTitle = styled.div`
  ${layoutMixins.row}
  gap: 1rem;
  font: var(--font-extra-bold);
`;
