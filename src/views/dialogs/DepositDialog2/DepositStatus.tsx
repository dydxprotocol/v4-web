import { useEffect, useMemo, useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { ArrowRightIcon } from '@radix-ui/react-icons';

import { ButtonAction } from '@/constants/buttons';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { appQueryClient } from '@/state/appQueryClient';
import { useAppSelector } from '@/state/appTypes';
import { selectDeposit } from '@/state/transfersSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

type DepositStatusProps = {
  txHash: string;
  chainId: string;
  onClose: () => void;
};

// TODO(deposit2.0): localization for this whole component
export const DepositStatus = ({ txHash, chainId, onClose }: DepositStatusProps) => {
  const deposit = useParameterizedSelector(selectDeposit, txHash, chainId);
  const { freeCollateral } = orEmptyObj(
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)
  );
  const initialFreeCollateral = useRef(freeCollateral);

  useEffect(() => {
    if (!deposit || deposit.status !== 'success') return;

    // Tell Bonsai to refetch wallet balances now so that the subaccount sweep can happen
    appQueryClient.invalidateQueries({ queryKey: ['validator', 'accountBalances'], exact: false });
  }, [deposit]);

  // Use difference in free collateral value to determine that the subaccount sweep has finished
  const depositSuccess =
    deposit?.status === 'success' &&
    freeCollateral &&
    !initialFreeCollateral.current?.eq(freeCollateral);

  const statusDescription = useMemo(() => {
    if (depositSuccess) return 'Your funds are now available for trading.';

    if (deposit?.isInstantDeposit)
      return 'Your funds will be available soon, and you may safely close this window.';

    return 'You may safely close this window.';
  }, [deposit, depositSuccess]);

  if (!deposit) return null;

  return (
    <div tw="flex flex-col gap-1 px-2 pb-1.5 pt-2.5">
      <div tw="flex flex-col gap-0.5">
        {!depositSuccess ? (
          <LoadingSpinner tw="self-center" id="deposit-status" size="64" strokeWidth="4" />
        ) : (
          <Icon tw="self-center" iconName={IconName.SuccessCircle} size="64px" />
        )}
        <div tw="flex flex-col items-center gap-0.375 px-3 py-1 text-center">
          <div tw="text-large">{!depositSuccess ? 'Deposit in progress' : 'Deposit complete'}</div>
          <div tw="text-color-text-0">{statusDescription}</div>
        </div>
      </div>
      <div tw="flex items-center justify-between self-stretch">
        <div tw="text-color-text-0">{depositSuccess ? 'Available balance' : 'Your deposit'}</div>
        <div tw="flex items-center gap-0.125">
          {depositSuccess ? (
            <>
              <ArrowRightIcon tw="text-green" />
              <Output tw="inline" value={freeCollateral} type={OutputType.Fiat} />
            </>
          ) : (
            <Output
              tw="inline"
              value={deposit.estimatedAmountUsd}
              type={OutputType.Fiat}
              slotLeft="~"
            />
          )}
        </div>
      </div>
      <Button onClick={onClose} action={depositSuccess ? ButtonAction.Primary : ButtonAction.Base}>
        {depositSuccess ? 'Start trading' : 'Close'}
      </Button>
    </div>
  );
};
