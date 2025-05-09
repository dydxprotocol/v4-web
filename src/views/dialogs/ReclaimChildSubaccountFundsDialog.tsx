import { useState } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { Description } from '@radix-ui/react-dialog';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { TransactionMemo } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, WithdrawFromSubaccountDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

import { useAccounts } from '@/hooks/useAccounts';
import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { selectReclaimableChildSubaccountFunds } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

export const ReclaimChildSubaccountFundsDialog = ({
  setIsOpen,
}: DialogProps<WithdrawFromSubaccountDialogProps>) => {
  const [isLoading, setIsLoading] = useState(false);
  const { dydxAddress } = useAccounts();
  const notify = useCustomNotification();
  const stringGetter = useStringGetter();
  const { transferBetweenSubaccounts } = useSubaccount();
  const reclaimableChildSubaccounts = useAppSelector(selectReclaimableChildSubaccountFunds);

  const reclaimableAmount = (reclaimableChildSubaccounts ?? EMPTY_ARR).reduce((acc, subaccount) => {
    return acc.plus(subaccount.usdcBalance);
  }, new BigNumber(0));

  const isDisabled = reclaimableAmount.eq(0);

  const handleReclaim = async () => {
    setIsLoading(true);
    try {
      if (reclaimableAmount.eq(0) || reclaimableChildSubaccounts == null || dydxAddress == null) {
        return;
      }

      logBonsaiInfo('ReclaimChildSubaccountFundsDialog', 'Reclaiming funds', {
        reclaimableChildSubaccounts,
        reclaimableAmount,
        dydxAddress,
      });

      await Promise.all(
        reclaimableChildSubaccounts.map(({ subaccountNumber, usdcBalance }) =>
          transferBetweenSubaccounts(
            {
              senderAddress: dydxAddress,
              subaccountNumber,
              destinationSubaccountNumber: 0,
              amount: usdcBalance.toString(),
              destinationAddress: dydxAddress,
            },
            TransactionMemo.reclaimIsolatedMarginFunds
          )
        )
      );

      notify({
        title: 'Reclaim Successful',
        body: stringGetter({
          key: STRING_KEYS.WITHDRAW_COMPLETE,
          params: { AMOUNT_USD: `${reclaimableAmount.toFixed(USD_DECIMALS)} USDC` },
        }),
        icon: <Icon iconName={IconName.CurrencySign} />,
      });

      setIsOpen(false);
    } catch (error) {
      logBonsaiError(
        'ReclaimChildSubaccountFundsDialog',
        'Error transfering funds between subaccounts',
        {
          error,
        }
      );
    }
    setIsLoading(false);
  };

  const reclaimableContent = (
    <$AmountContainer>
      <span tw="text-color-text-0 font-small-medium">
        {stringGetter({ key: STRING_KEYS.AVAILABLE })}
      </span>
      <Output
        tw="text-color-text-1 font-medium-medium"
        useGrouping
        withBaseFont
        type={OutputType.Fiat}
        value={reclaimableAmount}
      />
    </$AmountContainer>
  );

  const description =
    reclaimableChildSubaccounts && reclaimableChildSubaccounts.length > 0
      ? stringGetter({
          key: STRING_KEYS.RECLAIM_FUNDS_SIGNING,
          params: {
            NUM_TRANSACTIONS: reclaimableChildSubaccounts.length,
          },
        })
      : stringGetter({ key: STRING_KEYS.NO_FUNDS_TO_RECLAIM });

  return (
    <Dialog
      isOpen
      hasHeaderBorder
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.RECLAIM_FUNDS })}
    >
      <div tw="flexColumn mt-1.25 gap-1.25">
        <Description tw="text-color-text-0 font-base-book">{description}</Description>

        {reclaimableContent}

        <Button
          state={{ isLoading, isDisabled }}
          action={ButtonAction.Primary}
          onClick={handleReclaim}
        >
          {stringGetter({ key: STRING_KEYS.RECLAIM_FUNDS })}
        </Button>
      </div>
    </Dialog>
  );
};

const $AmountContainer = styled.div`
  ${layoutMixins.flexColumn}
  flex: 1;
  justify-content: space-between;

  border-radius: 0.5em;
  box-shadow: 0 0 0 1px var(--color-border);
  border-radius: 0.625rem;

  gap: 0.25rem;
  padding: 1rem;
`;
