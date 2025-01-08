import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { formatUnits, parseUnits } from 'viem';

import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USDC_DECIMALS } from '@/constants/tokens';

import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Output, OutputType } from '@/components/Output';

import { AmountInput } from './AmountInput';
import { RouteOptions } from './RouteOptions';
import { useBalance, useRoutes } from './queries';
import { DepositSpeed, DepositToken } from './types';
import { getTokenSymbol } from './utils';

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
  const tokenBalance = useBalance(token.chainId, token.denom);

  const debouncedAmount = useDebounce(amount);
  const { data: routes, isFetching, error } = useRoutes(token, debouncedAmount);

  useEffect(() => {
    if (debouncedAmount && !isFetching && !routes?.fast) setSelectedSpeed('slow');
  }, [isFetching, routes, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;
  const hasSufficientBalance = selectedRoute
    ? tokenBalance.raw && BigInt(selectedRoute.amountIn) <= BigInt(tokenBalance.raw)
    : true;

  const depositDisabled = isFetching || !hasSufficientBalance || !selectedRoute;

  const depositButtonInner = useMemo(() => {
    if (isFetching) return <LoadingDots size={3} />;
    if (!hasSufficientBalance) return `Insufficient ${getTokenSymbol(token.denom)}`;

    return stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS });
  }, [hasSufficientBalance, isFetching, stringGetter, token.denom]);

  return (
    <div tw="flex min-h-10 flex-col gap-1 p-1.25">
      <AmountInput
        tokenBalance={tokenBalance}
        value={amount}
        onChange={setAmount}
        token={token}
        onTokenClick={onTokenSelect}
      />
      {routes && (
        <RouteOptions
          routes={routes}
          isLoading={isFetching}
          disabled={!amount || parseUnits(amount, token.decimals) === BigInt(0)}
          selectedSpeed={selectedSpeed}
          onSelectSpeed={setSelectedSpeed}
        />
      )}
      {/* TODO(deposit2.0): make this error message better */}
      {error && (
        <div tw="text-center">
          There was an error. Please increase your deposit amount and try again.
        </div>
      )}
      <Button
        tw="w-full"
        state={depositDisabled ? ButtonState.Disabled : ButtonState.Default}
        disabled={depositDisabled}
        // slotLeft={<LoadingDots />}
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
      >
        {depositButtonInner}
      </Button>
      {/* TODO(deposit2.0): Show difference between current and new balance here */}
      {selectedRoute && (
        <div tw="flex justify-between text-small">
          {/* TODO(deposit2.0): localization */}
          <div tw="text-color-text-0">Available balance</div>
          <div style={{ color: isFetching ? 'var(--color-text-0)' : undefined }}>
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
