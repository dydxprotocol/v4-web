import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { BonsaiCore } from '@/abacus-ts/ontology';
import { formatUnits, parseUnits } from 'viem';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USDC_DECIMALS, WITHDRAWABLE_ASSETS } from '@/constants/tokens';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';

import { orEmptyObj } from '@/lib/typeUtils';

import { RouteOptions } from '../DepositDialog2/RouteOptions';
import { AddressInput } from './AddressInput';
import { AmountInput } from './AmountInput';
import { useWithdrawalDeltas, useWithdrawalRoutes } from './queries';

export const WithdrawForm = ({
  amount,
  setAmount,
  destinationAddress,
  setDestinationAddress,
  destinationChain,
  onChainSelect,
}: {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  destinationAddress: string;
  setDestinationAddress: Dispatch<SetStateAction<string>>;
  destinationChain: string;
  onChainSelect: () => void;
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
  });

  const {
    freeCollateral: updatedFreeCollateral,
    marginUsage: updatedMarginUsage,
    equity: updatedEquity,
  } = orEmptyObj(useWithdrawalDeltas({ withdrawAmount: debouncedAmount }));

  useEffect(() => {
    if (debouncedAmount && !isFetching && !routes?.fast) setSelectedSpeed('slow');
  }, [isFetching, routes, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;

  const routeInformation = selectedRoute && (
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
              value={formatUnits(BigInt(selectedRoute.amountOut), USDC_DECIMALS)}
            />
          ),
        },
        {
          key: 'freeCollateral',
          label: stringGetter({ key: STRING_KEYS.FREE_COLLATERAL }),
          value: (
            <DiffOutput
              withDiff={!freeCollateral?.eq(updatedFreeCollateral ?? 0)}
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
              withDiff={!marginUsage?.eq(updatedMarginUsage ?? 0)}
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
              withDiff={!equity?.eq(updatedEquity ?? 0)}
              type={OutputType.Fiat}
              value={equity}
              newValue={updatedEquity}
            />
          ),
        },
      ]}
    />
  );

  return (
    <div tw="flex min-h-10 flex-col gap-1 p-1.25">
      <AddressInput
        value={destinationAddress}
        onChange={setDestinationAddress}
        destinationChain={destinationChain}
        onDestinationClicked={onChainSelect}
      />
      <AmountInput value={amount} onChange={setAmount} />
      {routes && (
        <RouteOptions
          routes={routes}
          isLoading={isFetching}
          disabled={
            !amount || !selectedToken || parseUnits(amount, selectedToken.decimals) === BigInt(0)
          }
          selectedSpeed={selectedSpeed}
          onSelectSpeed={setSelectedSpeed}
        />
      )}
      {error && <AlertMessage type={AlertType.Error}>{error.message}</AlertMessage>}
      <Button
        tw="w-full"
        state={{ isLoading: isFetching }}
        disabled
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
      >
        {stringGetter({ key: STRING_KEYS.WITHDRAW })}
      </Button>
      {routeInformation}
    </div>
  );
};
