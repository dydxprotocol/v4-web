import { useMemo, useState } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import { Description } from '@radix-ui/react-dialog';
import styled from 'styled-components';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
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

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { SuccessTag, WarningTag } from '@/components/Tag';

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

  const buttonText = isDisabled
    ? subaccountNumberToWithdraw == null
      ? stringGetter({ key: STRING_KEYS.INSUFFICIENT_FREE_COLLATERAL })
      : stringGetter({ key: STRING_KEYS.SUFFICIENT_GAS_BALANCE })
    : stringGetter({ key: STRING_KEYS.WITHDRAW });

  const gasBalanceTag = usdcBalance ? (
    amountToWithdraw > 0 ? (
      <WarningTag tw="row gap-0.25 border-none bg-color-gradient-warning">
        {stringGetter({ key: STRING_KEYS.BELOW_RECOMMENDED_GAS_BALANCE })}
      </WarningTag>
    ) : (
      <SuccessTag tw="row gap-0.25 border-none bg-color-gradient-positive">
        <GreenCheckCircle css={{ '--icon-size': '0.75rem' }} />
        {stringGetter({ key: STRING_KEYS.SUFFICIENT_GAS_BALANCE })}
      </SuccessTag>
    )
  ) : null;

  return (
    <Dialog
      isOpen
      hasHeaderBorder
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.WITHDRAW_TO_WALLET })}
    >
      <$Container>
        <$Description>
          {stringGetter({
            key: STRING_KEYS.WITHDRAW_TO_WALLET_RECOMMENDATION,
            params: {
              MIN_RANGE: AMOUNT_USDC_BEFORE_REBALANCE,
              MAX_RANGE: AMOUNT_RESERVED_FOR_GAS_USDC,
            },
          })}
        </$Description>
        <$AmountContainer>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{stringGetter({ key: STRING_KEYS.AMOUNT })}</label>
          <$Output useGrouping withBaseFont type={OutputType.Fiat} value={amountToWithdraw} />
        </$AmountContainer>

        <div tw="row justify-between">
          <span tw="row gap-0.25 text-color-text-0 font-small-medium">
            <Icon
              tw="rounded-[50%] bg-color-text-0 p-0.125 text-color-layer-2"
              iconName={IconName.CurrencySign}
            />
            <span>{stringGetter({ key: STRING_KEYS.WALLET_BALANCE })}</span>
            <$Output
              tw="text-color-text-1 font-small-medium"
              useGrouping
              withBaseFont
              type={OutputType.Fiat}
              value={usdcBalance}
            />
          </span>
          {gasBalanceTag}
        </div>

        <Button
          state={{ isLoading, isDisabled }}
          action={ButtonAction.Primary}
          onClick={handleWithdrawToSubaccount}
        >
          {buttonText}
        </Button>
      </$Container>
    </Dialog>
  );
};

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
  margin-top: 1.25rem;
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
