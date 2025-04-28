import { useMemo, useState } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import { Description } from '@radix-ui/react-dialog';
import styled from 'styled-components';

import { AMOUNT_RESERVED_FOR_GAS_USDC } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, WithdrawToSubaccountDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

export const WithdrawToSubaccountDialog = ({
  setIsOpen,
}: DialogProps<WithdrawToSubaccountDialogProps>) => {
  const [isLoading, setIsLoading] = useState(false);
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { dydxAddress } = useAccounts();
  const childSubaccountSummaries = useAppSelector(BonsaiCore.account.childSubaccountSummaries.data);
  const usdcBalance = useAppSelector(BonsaiCore.account.balances.data).usdcAmount;
  const usdcBalanceBN = MustBigNumber(usdcBalance);

  const stringGetter = useStringGetter();

  const { withdraw } = useSubaccount();
  const { usdcDenom } = useTokenConfigs();

  const { refetchQuery } = useAccountBalance({
    chainId: selectedDydxChainId,
    isCosmosChain: true,
    addressOrDenom: usdcDenom,
  });

  const amountToWithdraw = MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC)
    .minus(usdcBalanceBN)
    .toNumber();

  const subaccountNumberToWithdraw = useMemo(() => {
    if (!childSubaccountSummaries) {
      return undefined;
    }

    const maybeSubaccountNumber = objectEntries(childSubaccountSummaries).find(([_, summary]) => {
      if (summary.freeCollateral.gt(amountToWithdraw)) {
        return true;
      }

      return false;
    })?.[0];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (maybeSubaccountNumber == null) {
      return undefined;
    }

    return parseInt(maybeSubaccountNumber, 10);
  }, [childSubaccountSummaries, amountToWithdraw]);

  const handleWithdrawToSubaccount = async () => {
    setIsLoading(true);
    try {
      if (childSubaccountSummaries == null || usdcBalance == null) {
        return;
      }

      const subaccountNumber = Number(subaccountNumberToWithdraw);

      logBonsaiInfo('WithdrawToSubaccountDialog', 'Withdrawing from subaccount', {
        usdcBalance,
      });
      const tx = await withdraw(amountToWithdraw, subaccountNumber);
      if (tx && dydxAddress) {
        await refetchQuery();

        setIsOpen(false);
      }
    } catch (error) {
      logBonsaiError('WithdrawToSubaccountDialog', 'Error withdrawing from subaccount', { error });
    }
    setIsLoading(false);
  };

  const isDisabled = subaccountNumberToWithdraw == null || amountToWithdraw <= 0;

  const alertMessage = useMemo(() => {
    if (isDisabled) {
      if (amountToWithdraw <= 0) {
        return {
          type: AlertType.Success,
          message: 'Your wallet has the recommended USDC balance for gas.',
        };
      }

      if (subaccountNumberToWithdraw == null) {
        return {
          type: AlertType.Error,
          message: 'Your trading account has no free collateral to withdraw from.',
        };
      }
    }

    return undefined;
  }, [isDisabled, amountToWithdraw, subaccountNumberToWithdraw]);

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title="Withdraw to wallet">
      <$Container>
        <$Description>
          Add gas funds to your wallet by withdrawing from your trading account
        </$Description>
        <$AmountContainer>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{stringGetter({ key: STRING_KEYS.AMOUNT })}</label>
          <$Output useGrouping withBaseFont type={OutputType.Fiat} value={amountToWithdraw} />
        </$AmountContainer>
        {alertMessage && (
          <AlertMessage type={alertMessage.type}>{alertMessage.message}</AlertMessage>
        )}
        <Button
          state={{ isLoading, isDisabled }}
          action={ButtonAction.Primary}
          onClick={handleWithdrawToSubaccount}
        >
          {stringGetter({ key: STRING_KEYS.WITHDRAW })}
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
