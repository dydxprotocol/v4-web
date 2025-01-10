import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { formatUnits, parseUnits } from 'viem';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TokenForTransfer, USDC_DECIMALS } from '@/constants/tokens';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import { CoinbaseBrandIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { AmountInput } from './AmountInput';
import { RouteOptions } from './RouteOptions';
import { useDepositRoutes } from './queries';

export const DepositForm = ({
  onTokenSelect,
  amount,
  setAmount,
  token,
  onClose,
}: {
  onTokenSelect: () => void;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  token: TokenForTransfer;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const [selectedSpeed, setSelectedSpeed] = useState<SkipRouteSpeed>('fast');

  const debouncedAmount = useDebounce(amount);
  const { data: routes, isFetching } = useDepositRoutes(token, debouncedAmount);

  useEffect(() => {
    if (debouncedAmount && !isFetching && !routes?.fast) setSelectedSpeed('slow');
  }, [isFetching, routes, debouncedAmount]);

  const selectedRoute = selectedSpeed === 'fast' ? routes?.fast : routes?.slow;

  return (
    <div tw="flex min-h-10 flex-col gap-2 p-1.25">
      <div tw="flex flex-col gap-0.5">
        <AmountInput
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
        <div tw="flex flex-col gap-0.5">
          <div tw="flex items-center gap-1">
            <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
            {/* TODO(deposit2): localization */}
            <div tw="text-color-text-0">or</div>
            <hr tw="flex-1 border-[0.5px] border-solid border-color-border" />
          </div>
          <Button
            onClick={() => {
              dispatch(openDialog(DialogTypes.CoinbaseDepositDialog({})));
              onClose();
            }}
            type={ButtonType.Button}
            tw="flex items-center border border-solid border-color-border bg-color-layer-4 px-2 py-1 font-medium"
          >
            {/* TODO(deposit2): localization */}
            <div>
              Deposit with <span tw="sr-only">Coinbase</span>
            </div>
            <div tw="flex">
              <CoinbaseBrandIcon />
            </div>
          </Button>
        </div>
      </div>
      <div tw="flex flex-col gap-0.5">
        <Button
          tw="w-full"
          state={{ isDisabled: true, isLoading: isFetching }}
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
    </div>
  );
};
