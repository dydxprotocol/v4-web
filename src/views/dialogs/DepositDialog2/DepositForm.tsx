import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { formatUnits, parseUnits } from 'viem';

import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { USDC_DECIMALS } from '@/constants/tokens';
import { AmountInput } from './AmountInput';
import { RouteOptions } from './RouteOptions';
import { useRoutes } from './queries';
import { DepositSpeed, DepositToken } from './types';

export const DepositForm = ({
  onTokenSelect,
  amount,
  setAmount,
  token,
}: {
  onTokenSelect: () => void;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  token: DepositToken;
}) => {
  const stringGetter = useStringGetter();
  const [selectedSpeed, setSelectedSpeed] = useState<DepositSpeed>('fast');

  const debouncedAmount = useDebounce(amount);
  const { data: routes, isFetching } = useRoutes(token, debouncedAmount);

  useEffect(() => {
    if (debouncedAmount && !isFetching && !routes?.fast) setSelectedSpeed('slow');
  }, [isFetching, routes, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;

  return (
    <div tw="flex min-h-10 flex-col gap-1 p-1.25">
      <AmountInput value={amount} onChange={setAmount} token={token} onTokenClick={onTokenSelect} />
      {routes && (
        <RouteOptions
          routes={routes}
          isLoading={isFetching}
          disabled={!amount || parseUnits(amount, token.decimals) === BigInt(0)}
          selectedSpeed={selectedSpeed}
          onSelectSpeed={setSelectedSpeed}
        />
      )}
      <Button
        tw="w-full"
        state={ButtonState.Disabled}
        disabled
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
      >
        {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
      </Button>
      {/* TODO(deposit2.0): Show difference between current and new balance here */}
      {selectedRoute && (
        <div tw="flex justify-between text-small">
          {/* TODO(deposit2.0): localization */}
          <div tw="text-color-text-0">Available balance</div>
          <div>
            +
            <Output
              tw="inline"
              type={OutputType.Fiat}
              value={formatUnits(BigInt(selectedRoute.amountOut), USDC_DECIMALS)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
