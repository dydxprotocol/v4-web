import { useState } from 'react';

import { Description } from '@radix-ui/react-dialog';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { ConfirmPendingDepositDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { SUPPORTED_COSMOS_CHAINS } from '@/lib/graz';
import { log } from '@/lib/telemetry';

export const ConfirmPendingDepositDialog = ({
  setIsOpen,
  usdcBalance,
}: DialogProps<ConfirmPendingDepositDialogProps>) => {
  const [isLoading, setIsLoading] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { dydxAddress } = useAccounts();

  const { transferNotifications, addOrUpdateTransferNotification } = useLocalNotifications();
  const stringGetter = useStringGetter();

  const { deposit } = useSubaccount();
  const { usdcDenom } = useTokenConfigs();

  const { refetchQuery } = useAccountBalance({
    chainId: selectedDydxChainId,
    isCosmosChain: true,
    addressOrDenom: usdcDenom,
  });

  const handleDepositToSubaccount = async () => {
    setIsLoading(true);
    try {
      const tx = await deposit(usdcBalance);
      if (tx && dydxAddress) {
        await refetchQuery();

        transferNotifications.forEach((notification) => {
          const isCosmosPendingDeposit =
            SUPPORTED_COSMOS_CHAINS.includes(notification.fromChainId ?? '') &&
            notification.fromChainId !== selectedDydxChainId &&
            notification.isSubaccountDepositCompleted !== true;
          if (isCosmosPendingDeposit) {
            const updatedNotification = {
              ...notification,
              isSubaccountDepositCompleted: true,
            };
            addOrUpdateTransferNotification(updatedNotification);
          }
        });
        setIsOpen(false);
      }
    } catch (err) {
      log('ConfirmPendingDepositDialog/handleDepositToSubAccount', err);
    }
    setIsLoading(false);
  };

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Confirm Pending Deposit">
      <$Container>
        <$Description>
          Fund your dYdX subaccount balance once your IBC transfer has been received.
        </$Description>
        <$AmountContainer>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>Amount</label>
          <$Output useGrouping withBaseFont type={OutputType.Fiat} value={usdcBalance} />
        </$AmountContainer>
        <Button
          state={{ isLoading }}
          action={ButtonAction.Primary}
          onClick={handleDepositToSubaccount}
        >
          {stringGetter({ key: STRING_KEYS.CONTINUE })}
        </Button>
      </$Container>
    </Dialog>
  );
};

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

const $Description = styled(Description)`
  color: var(--color-text-0);
  font: var(--font-base-book);
`;
const $AmountContainer = styled.div`
  ${layoutMixins.flexColumn}
  flex: 1;
  justify-content: space-between;

  border-radius: 0.5em;
  box-shadow: 0 0 0 1px var(--color-border);
  border-radius: 0.625rem;

  gap: 0.25rem;
  padding: 1rem;

  label {
    color: var(--color-text-0);
    font: var(--font-small-medium);
  }

  output {
    color: var(--color-text-1);
    font: var(--font-medium-medium);
  }
`;
const $Output = styled(Output)`
  font: var(--font-extra-book);
  color: var(--color-text-2);

  @media ${breakpoints.tablet} {
    font: var(--font-base-book);
  }
`;
