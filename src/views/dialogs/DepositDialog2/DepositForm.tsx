import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { formatUnits, parseUnits } from 'viem';

import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer, USDC_DECIMALS } from '@/constants/tokens';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { AmountInput } from './AmountInput';
import { RouteOptions } from './RouteOptions';
import { useDepositRoutes } from './queries';

export const DepositForm = ({
  onTokenSelect,
  amount,
  setAmount,
  token,
}: {
  onTokenSelect: () => void;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  token: TokenForTransfer;
}) => {
  const stringGetter = useStringGetter();
  const [selectedSpeed, setSelectedSpeed] = useState<SkipRouteSpeed>('fast');

  const debouncedAmount = useDebounce(amount);
  const { data: routes, isFetching } = useDepositRoutes(token, debouncedAmount);

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
          <div tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.AVAILABLE_BALANCE })}</div>
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
