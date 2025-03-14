import styled from 'styled-components';

import { AnalyticsEvents } from '@/constants/analytics';
import { DepositDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { track } from '@/lib/analytics/analytics';

import { TestnetDepositForm } from '../forms/AccountManagementForms/TestnetDepositForm';

export const TestnetFaucetDialog = ({ setIsOpen }: DialogProps<DepositDialogProps>) => {
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  return (
    <Dialog
      isOpen
      withAnimation
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        <TestnetDepositForm
          onDeposit={() => {
            track(AnalyticsEvents.TransferFaucet());
          }}
        />
      </$Content>
    </Dialog>
  );
};

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;

  form {
    flex: 1;
  }
`;
