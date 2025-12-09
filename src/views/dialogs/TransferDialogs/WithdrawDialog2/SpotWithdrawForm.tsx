import { Dispatch, SetStateAction, useMemo } from 'react';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { SOLANA_MAINNET_ID } from '@/constants/solana';
import { MIN_SOL_RESERVE, SOLANA_BASE_TRANSACTION_FEE } from '@/constants/spot';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { WarningIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { addSpotWithdraw, SpotWithdraw, updateSpotWithdraw } from '@/state/transfers';

import { AttemptBigNumber } from '@/lib/numbers';

import { isValidWithdrawalAddress } from '../utils';
import { AddressInput } from './AddressInput';
import { SpotAmountInput } from './SpotAmountInput';
import { useMaxWithdrawableSol, useSolBalance, useWithdrawSol } from './withdrawSpotHooks';

// TODO: spot localization

export const SpotWithdrawForm = ({
  amount,
  setAmount,
  destinationAddress,
  setDestinationAddress,
  onWithdrawSigned,
}: {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  destinationAddress: string;
  setDestinationAddress: Dispatch<SetStateAction<string>>;
  onWithdrawSigned: (withdrawId: string) => void;
}) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { dydxAddress, solanaAddress } = useAccounts();

  const { data: solBalance } = useSolBalance();
  const maxWithdrawable = useMaxWithdrawableSol();
  const { mutateAsync: executeWithdraw, isPending } = useWithdrawSol();

  const amountBN = AttemptBigNumber(amount);
  const solBalanceBN = AttemptBigNumber(solBalance);
  const updatedBalance = solBalanceBN?.minus(amountBN ?? 0);

  const validationError = useMemo(() => {
    if (!destinationAddress || !amount) {
      return undefined;
    }

    if (!solanaAddress) {
      return 'Solana wallet not connected';
    }

    if (!isValidWithdrawalAddress(destinationAddress, SOLANA_MAINNET_ID)) {
      return 'Invalid Solana address';
    }

    if (amountBN == null || amountBN.lte(0)) {
      return 'Amount must be greater than zero';
    }

    if (solBalanceBN == null) {
      return 'Loading balance...';
    }

    if (amountBN.gt(solBalanceBN)) {
      return stringGetter({ key: STRING_KEYS.INSUFFICIENT_BALANCE });
    }

    if (amountBN.gt(maxWithdrawable)) {
      return `Must keep ${MIN_SOL_RESERVE} SOL reserved for fees`;
    }

    return undefined;
  }, [
    destinationAddress,
    amount,
    solanaAddress,
    amountBN,
    solBalanceBN,
    maxWithdrawable,
    stringGetter,
  ]);

  const withdrawDisabled = !destinationAddress || !amount || !!validationError;

  const handleWithdraw = async () => {
    if (withdrawDisabled || !dydxAddress) return;

    const withdrawId = crypto.randomUUID();

    const spotWithdraw: SpotWithdraw = {
      id: withdrawId,
      type: 'spot-withdraw',
      amount,
      destinationAddress,
      status: 'pending',
    };

    dispatch(addSpotWithdraw({ withdraw: spotWithdraw, dydxAddress }));
    onWithdrawSigned(withdrawId);

    try {
      const { signature } = await executeWithdraw({ amount, destinationAddress });

      dispatch(
        updateSpotWithdraw({
          dydxAddress,
          withdrawId,
          updates: { status: 'success', txSignature: signature },
        })
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      dispatch(
        updateSpotWithdraw({
          dydxAddress,
          withdrawId,
          updates: { status: 'error', error: errorMessage },
        })
      );
    }
  };

  const receipt = (
    <Details
      tw="font-small-book"
      items={[
        {
          key: 'balance',
          label: 'Balance',
          value: (
            <DiffOutput
              withDiff={!solBalanceBN?.eq(updatedBalance ?? 0)}
              type={OutputType.Number}
              value={solBalance}
              newValue={updatedBalance?.toString()}
              fractionDigits={4}
              slotRight=" SOL"
            />
          ),
        },
        {
          key: 'fee',
          label: 'Estimated Fee',
          value: (
            <Output
              tw="inline"
              type={OutputType.Number}
              value={SOLANA_BASE_TRANSACTION_FEE}
              fractionDigits={6}
              slotLeft="~"
              slotRight=" SOL"
            />
          ),
        },
      ]}
    />
  );

  const buttonInner = validationError ? (
    <div tw="row gap-0.5">
      <WithTooltip tooltipString={validationError}>
        <WarningIcon tw="text-color-error" />
      </WithTooltip>
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </div>
  ) : (
    stringGetter({ key: STRING_KEYS.WITHDRAW })
  );

  return (
    <div tw="flex h-full min-h-10 flex-col gap-1">
      <AddressInput
        value={destinationAddress}
        onChange={setDestinationAddress}
        destinationChain={SOLANA_MAINNET_ID}
        onDestinationClicked={() => {}}
        placeholder={`${stringGetter({ key: STRING_KEYS.ADDRESS })}...`}
        isChainSelectable={false}
      />

      <SpotAmountInput
        amount={amount}
        setAmount={setAmount}
        solBalance={solBalance}
        maxWithdrawable={maxWithdrawable}
        isPending={isPending}
      />

      <div tw="flexColumn mt-auto gap-0.5">
        {receipt}

        <Button
          tw="w-full"
          state={{
            isLoading: isPending,
            isDisabled: withdrawDisabled,
          }}
          onClick={handleWithdraw}
          action={ButtonAction.Primary}
        >
          {buttonInner}
        </Button>
      </div>
    </div>
  );
};
