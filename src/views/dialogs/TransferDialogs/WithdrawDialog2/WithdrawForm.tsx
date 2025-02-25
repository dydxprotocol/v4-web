import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { formatUnits, parseUnits } from 'viem';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USDC_DECIMALS, WITHDRAWABLE_ASSETS } from '@/constants/tokens';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { WarningIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppSelector } from '@/state/appTypes';
import { Withdraw, WithdrawSubtransaction } from '@/state/transfers';

import { track } from '@/lib/analytics/analytics';
import { log } from '@/lib/telemetry';
import { orEmptyObj } from '@/lib/typeUtils';

import { TransferRouteOptions } from '../RouteOptions';
import { AddressInput } from './AddressInput';
import { AmountInput } from './AmountInput';
import { useWithdrawalDeltas, useWithdrawalRoutes } from './queries';
import { useProtocolWithdrawalValidation, useWithdrawStep } from './withdrawHooks';

export const WithdrawForm = ({
  amount,
  setAmount,
  destinationAddress,
  setDestinationAddress,
  destinationChain,
  onChainSelect,
  onWithdraw,
  onWithdrawBroadcastUpdate,
  onWithdrawSigned,
}: {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  destinationAddress: string;
  setDestinationAddress: Dispatch<SetStateAction<string>>;
  destinationChain: string;
  onChainSelect: () => void;
  onWithdraw: (withdraw: Withdraw) => void;
  onWithdrawBroadcastUpdate: (withdrawId: string, subtransaction: WithdrawSubtransaction) => void;
  onWithdrawSigned: (withdrawId: string) => void;
}) => {
  const stringGetter = useStringGetter();
  const [selectedSpeed, setSelectedSpeed] = useState<SkipRouteSpeed>('fast');
  const debouncedAmount = useDebounce(amount);
  const selectedToken = WITHDRAWABLE_ASSETS.find((token) => token.chainId === destinationChain);
  const { freeCollateral, marginUsage, equity } = orEmptyObj(
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)
  );

  const {
    data: routes,
    isFetching,
    error,
  } = useWithdrawalRoutes({
    token: selectedToken,
    amount: debouncedAmount,
    destinationAddress,
  });

  const {
    freeCollateral: updatedFreeCollateral,
    marginUsage: updatedMarginUsage,
    equity: updatedEquity,
  } = orEmptyObj(useWithdrawalDeltas({ withdrawAmount: debouncedAmount }));

  // @ts-expect-error SDK doesn't know about .goFastTransfer
  const hasGoFastRoute = routes?.fast.operations.find((op) => op.goFastTransfer);

  useEffect(() => {
    if (debouncedAmount && !isFetching && !hasGoFastRoute) setSelectedSpeed('slow');
  }, [isFetching, hasGoFastRoute, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;

  const { executeWithdraw, isLoading } = useWithdrawStep({
    destinationAddress,
    withdrawRoute: selectedRoute,
    onWithdraw,
    onWithdrawBroadcastUpdate,
    onWithdrawSigned,
  });

  // ------ Errors + Validation ------ //
  useEffect(() => {
    if (error) {
      log('DepositForm/useWithdrawalRoutes', error);
    }
  }, [error]);

  const validationError = useProtocolWithdrawalValidation({
    freeCollateral,
    withdrawAmount: debouncedAmount,
    selectedRoute,
  });

  const isDebouncedAmountSame = debouncedAmount === amount;

  const withdrawDisabled =
    !selectedRoute ||
    destinationAddress === '' ||
    amount === '' ||
    !!validationError ||
    !isDebouncedAmountSame;

  const buttonInner = error ? (
    <div tw="row gap-0.5">
      <WithTooltip tooltipString={error.message}>
        <WarningIcon tw="text-color-error" />
      </WithTooltip>
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </div>
  ) : validationError ? (
    <div tw="row gap-0.5">
      <WithTooltip tooltipString={validationError}>
        <WarningIcon tw="text-color-error" />
      </WithTooltip>
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </div>
  ) : (
    stringGetter({ key: STRING_KEYS.WITHDRAW })
  );

  const receipt = selectedRoute && (
    <Details
      tw="font-small-book"
      items={[
        {
          key: 'amount',
          label: stringGetter({ key: STRING_KEYS.WITHDRAW }),
          value: (
            <Output
              tw="inline"
              type={OutputType.Fiat}
              isLoading={isFetching}
              value={formatUnits(BigInt(selectedRoute.amountOut), USDC_DECIMALS)}
            />
          ),
        },
        {
          key: 'freeCollateral',
          label: stringGetter({ key: STRING_KEYS.FREE_COLLATERAL }),
          value: (
            <DiffOutput
              withDiff={!freeCollateral?.eq(updatedFreeCollateral ?? 0) && !isFetching}
              hasInvalidNewValue={updatedFreeCollateral?.lt(0)}
              type={OutputType.Fiat}
              value={freeCollateral}
              newValue={updatedFreeCollateral}
            />
          ),
        },
        {
          key: 'marginUsage',
          label: stringGetter({ key: STRING_KEYS.MARGIN_USAGE }),
          value: (
            <DiffOutput
              withDiff={!marginUsage?.eq(updatedMarginUsage ?? 0) && !isFetching}
              type={OutputType.Percent}
              value={marginUsage}
              newValue={updatedMarginUsage}
            />
          ),
        },
        {
          key: 'equity',
          label: stringGetter({ key: STRING_KEYS.EQUITY }),
          value: (
            <DiffOutput
              withDiff={!equity?.eq(updatedEquity ?? 0) && !isFetching}
              hasInvalidNewValue={updatedEquity?.lt(0)}
              type={OutputType.Fiat}
              value={equity}
              newValue={updatedEquity}
            />
          ),
        },
      ]}
    />
  );

  const onWithdrawClick = async () => {
    if (withdrawDisabled) return;

    track(
      AnalyticsEvents.WithdrawInitiated({
        sourceAssetDenom: selectedRoute.sourceAssetDenom,
        sourceAssetChainID: selectedRoute.sourceAssetChainID,
        amountIn: selectedRoute.amountIn,
        amountOut: selectedRoute.amountOut,
        usdAmountOut: selectedRoute.usdAmountOut,
        estimatedAmountOut: selectedRoute.estimatedAmountOut,
        swapPriceImpactPercent: selectedRoute.swapPriceImpactPercent,
        estimatedRouteDurationSeconds: selectedRoute.estimatedRouteDurationSeconds,
      })
    );

    executeWithdraw();
  };

  return (
    <div tw="flex min-h-10 flex-col gap-1 p-1.25">
      <AddressInput
        value={destinationAddress}
        onChange={setDestinationAddress}
        destinationChain={destinationChain}
        onDestinationClicked={onChainSelect}
      />
      <AmountInput value={amount} onChange={setAmount} />
      <TransferRouteOptions
        routes={routes}
        isLoading={isFetching}
        disabled={
          !amount || !selectedToken || parseUnits(amount, selectedToken.decimals) === BigInt(0)
        }
        selectedSpeed={selectedSpeed}
        onSelectSpeed={setSelectedSpeed}
        type="withdraw"
      />
      <Button
        tw="mt-1 w-full"
        state={{
          isLoading: isFetching || isLoading,
          isDisabled: withdrawDisabled,
        }}
        onClick={onWithdrawClick}
        action={ButtonAction.Primary}
      >
        {buttonInner}
      </Button>
      {receipt}
    </div>
  );
};
