import { EventHandler, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits, parseUnits } from 'viem';

import { ButtonAction, ButtonState } from '@/constants/buttons';
import { DYDX_DECIMALS, USDC_DECIMALS } from '@/constants/tokens';

import { useSwapQuote } from '@/hooks/swap/useSwapQuote';
import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { getUserAddressesForRoute } from '@/views/dialogs/TransferDialogs/utils';

import { useAppSelector } from '@/state/appTypes';

import { escapeRegExp, numericValueRegex } from '@/lib/inputUtils';

type SwapMode = 'exact-in' | 'exact-out';
function otherToken(currToken: 'usdc' | 'dydx') {
  return currToken === 'usdc' ? 'dydx' : 'usdc';
}

export const Swap = () => {
  const { skipClient } = useSkipClient();
  const [inputToken, setInputToken] = useState<'dydx' | 'usdc'>('usdc');
  const [mode, setMode] = useState<SwapMode>('exact-in');
  const [amount, setAmount] = useState('');
  const { nobleAddress, dydxAddress, osmosisAddress, neutronAddress } = useAccounts();
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false);

  const { chainTokenAmount: nativeTokenBalance, usdcAmount: usdcBalance } = useAppSelector(
    BonsaiCore.account.balances.data
  );

  console.log('usdcBalance', usdcBalance);

  const tokenBalances = useMemo(() => {
    const dydx = {
      rawBalance: nativeTokenBalance ? parseUnits(nativeTokenBalance, DYDX_DECIMALS) : undefined,
      formatted: nativeTokenBalance,
    };
    const usdc = {
      rawBalance: usdcBalance ? parseUnits(usdcBalance, USDC_DECIMALS) : undefined,
      formatted: usdcBalance,
    };

    if (inputToken === 'usdc') {
      return {
        inputBalance: usdc,
        outputBalance: dydx,
      };
    }

    return {
      inputBalance: dydx,
      outputBalance: usdc,
    };
  }, [nativeTokenBalance, usdcBalance, inputToken]);

  const onSwitchTokens = () => {
    setInputToken(inputToken === 'usdc' ? 'dydx' : 'usdc');
    setAmount('');
  };

  const onValueChange: (m: SwapMode) => EventHandler<SyntheticInputEvent> = (m) => (e) => {
    if (!numericValueRegex.test(escapeRegExp(e.target.value))) {
      return;
    }

    setMode(m);
    setAmount(e.target.value.toString());
  };

  const debouncedAmount = useDebounce(amount);

  const { data: quote, isLoading, error } = useSwapQuote(inputToken, debouncedAmount, mode);

  const quotedAmount = useMemo(() => {
    if (!quote) return '';

    const quotedToken = mode === 'exact-in' ? otherToken(inputToken) : inputToken;
    const quotedTokenDecimals = quotedToken === 'dydx' ? DYDX_DECIMALS : USDC_DECIMALS;
    const quotedTokenAmount = mode === 'exact-in' ? quote.amountOut : quote.amountIn;

    return formatUnits(BigInt(quotedTokenAmount), quotedTokenDecimals);
  }, [quote, inputToken, mode]);

  const [from, to] = mode === 'exact-in' ? [amount, quotedAmount] : [quotedAmount, amount];

  const priceImpact = useMemo(() => {
    if (!quote) return null;

    const difference = Number(quote.usdAmountOut) - Number(quote.usdAmountIn);
    const value = difference / Number(quote.usdAmountIn);

    if (value > 0.0001) {
      return { value, color: 'var(--color-positive)' };
    }

    if (value > 0.005) {
      return { value, color: 'var(--color-text-1)' };
    }

    if (value > -0.05) {
      return { value, color: 'var(--color-warning)' };
    }

    return { value, color: 'var(--color-negative)' };
  }, [quote]);

  const onSwap = async () => {
    if (!quote) return;

    setIsSwapSubmitting(true);
    const userAddresses = getUserAddressesForRoute(
      quote,
      // Don't need source account for swaps
      undefined,
      nobleAddress,
      dydxAddress,
      osmosisAddress,
      neutronAddress
    );
    try {
      await skipClient.executeRoute({
        route: quote,
        userAddresses,
        onTransactionCompleted: async ({ chainId, txHash, status }) => {
          console.log('TX completed!', chainId, txHash, status);
          setIsSwapSubmitting(false);
        },
        onTransactionBroadcast: async ({ txHash, chainId }) => {
          console.log('tx broadcast:', txHash, chainId);
        },
        onTransactionSigned: async () => {
          console.log('tx signed');
        },
      });
    } catch (e) {
      console.error('there was an error!', e);
    }
  };

  return (
    <div tw="flex flex-col gap-1">
      <div tw="">From</div>
      <div>
        Balance: {tokenBalances.inputBalance.formatted} {inputToken}
      </div>
      <div tw="flex items-center gap-0.125">
        <$Input
          $isLoading={mode === 'exact-out' && isLoading}
          type="text"
          placeholder="0"
          value={from}
          onChange={onValueChange('exact-in')}
        />
        <div>{inputToken}</div>
      </div>
      <div>Input USD: {quote?.usdAmountIn ?? '-'}</div>
      <div>To</div>
      <div>
        Balance: {tokenBalances.outputBalance.formatted} {otherToken(inputToken)}
      </div>
      <div tw="flex items-center gap-0.125">
        <$Input
          $isLoading={mode === 'exact-in' && isLoading}
          type="text"
          placeholder="0"
          value={to}
          onChange={onValueChange('exact-out')}
        />
        <div>{inputToken === 'dydx' ? 'usdc' : 'dydx'}</div>
      </div>
      {error ? (
        <div tw="text-color-warning">Route not found</div>
      ) : (
        <div tw="flex items-center gap-0.5">
          Output USD: {quote?.usdAmountOut ?? '-'}{' '}
          {priceImpact && (
            <Output
              css={{ color: priceImpact.color }}
              type={OutputType.Percent}
              value={priceImpact.value}
              slotLeft={priceImpact.value > 0 ? '(+' : '('}
              slotRight=")"
            />
          )}
        </div>
      )}
      <button tw="self-start" type="button" onClick={onSwitchTokens}>
        Switch tokens
      </button>
      <Button
        state={isSwapSubmitting ? ButtonState.Loading : ButtonState.Default}
        disabled={!quote}
        onClick={onSwap}
        action={ButtonAction.Primary}
      >
        Swap
      </Button>
    </div>
  );
};

const $Input = styled.input<{ hasError?: boolean; $isLoading: boolean }>`
  flex: 1;
  ${tw`min-w-0 flex-1 text-color-text-2 outline-none font-extra-medium`};
  ${({ hasError }) => hasError && tw`text-color-error`};
  opacity: ${({ $isLoading }) => ($isLoading ? '0.4' : '1')};
  background-color: var(--deposit-dialog-amount-bgColor, var(--color-layer-4));
  text-overflow: ellipsis;
`;
