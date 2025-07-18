import { useCallback } from 'react';

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { DialogProps, OnboardingDialogProps } from '@/constants/dialogs';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import breakpoints from '@/styles/breakpoints';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { setOnboardedThisSession } from '@/state/account';
import { useAppDispatch } from '@/state/appTypes';

import { Authenticate } from './Authenticate';

export const OnboardingDialog2 = ({
  setIsOpen: setIsOpenRaw,
}: DialogProps<OnboardingDialogProps>) => {
  const dispatch = useAppDispatch();
  const { isMobile } = useBreakpoints();

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        dispatch(setOnboardedThisSession(true));
      }
      setIsOpenRaw(open);
    },
    [dispatch, setIsOpenRaw]
  );

  const setIsOpenFromDialog = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpenFromDialog}
      title="Sign in"
      description="To get started, sign in with your social accounts, create a passkey or connect your wallet."
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        <Authenticate />
      </$Content>
    </$Dialog>
  );
};
const $Content = tw.div`flexColumn gap-1`;

const $Dialog = styled(Dialog)<{ width?: string }>`
  @media ${breakpoints.notMobile} {
    ${({ width }) =>
      width &&
      css`
        --dialog-width: ${width};
      `}
  }

  --dialog-icon-size: 1.25rem;
  --dialog-content-paddingBottom: 1rem;
`;
