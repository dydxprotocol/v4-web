import { EventHandler, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits, parseUnits } from 'viem';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonSize, ButtonState } from '@/constants/buttons';
import { DYDX_DECIMALS, USDC_DECIMALS } from '@/constants/tokens';

import { useSwapQuote } from '@/hooks/swap/useSwapQuote';
import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';
import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useDebounce } from '@/hooks/useDebounce';

import ArrowIcon from '@/icons/arrow.svg';
import CardHolderIcon from '@/icons/card-holder.svg';
import CaretDown from '@/icons/caret-down.svg';
import DydxLogo from '@/icons/dydx-protocol.svg';
import UsdcLogo from '@/icons/usdc.svg';
import WarningFilled from '@/icons/warning-filled.svg';

import { Accordion } from '@/components/Accordion';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';
import { getUserAddressesForRoute } from '@/views/dialogs/TransferDialogs/utils';

import { getOnboardingState } from '@/state/accountSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { useAppSelector } from '@/state/appTypes';

import { escapeRegExp, numericValueRegex } from '@/lib/inputUtils';

type SwapMode = 'exact-in' | 'exact-out';
function otherToken(currToken: 'usdc' | 'dydx') {
  return currToken === 'usdc' ? 'dydx' : 'usdc';
}

function getTokenLabel(token: 'usdc' | 'dydx') {
  return token === 'usdc' ? 'USDC' : 'dYdX';
}

export const Swap = () => {
  const { skipClient } = useSkipClient();
  const [inputToken, setInputToken] = useState<'dydx' | 'usdc'>('usdc');
  const [mode, setMode] = useState<SwapMode>('exact-in');
  const [amount, setAmount] = useState('');
  const { nobleAddress, dydxAddress, osmosisAddress, neutronAddress } = useAccounts();
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false);
  const onboardingState = useAppSelector(getOnboardingState);

  const { chainTokenAmount: nativeTokenBalance, usdcAmount: usdcBalance } = useAppSelector(
    BonsaiCore.account.balances.data
  );

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
      dydx,
      usdc,
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

  const {
    data: quote,
    isLoading,
    isPlaceholderData,
    error,
  } = useSwapQuote(inputToken, debouncedAmount, mode);

  const hasSufficientBalance = useMemo(() => {
    if (!quote || !amount) return true;

    const inputAmount = parseUnits(
      quote.amountIn,
      quote.sourceAssetDenom === 'adydx' ? DYDX_DECIMALS : USDC_DECIMALS
    );
    const inputBalance =
      quote.sourceAssetDenom === 'adydx'
        ? tokenBalances.dydx?.rawBalance
        : tokenBalances.usdc?.rawBalance;

    if (!inputBalance) return true;

    return inputBalance <= inputAmount;
  }, [quote, amount, tokenBalances.dydx?.rawBalance, tokenBalances.usdc?.rawBalance]);

  const { data: priceQuote } = useSwapQuote('dydx', '1', 'exact-in');

  const usdcPerDydx = useMemo(() => {
    if (!priceQuote) return undefined;

    return Number(formatUnits(BigInt(priceQuote.amountOut), USDC_DECIMALS));
  }, [priceQuote]);

  const quotedAmount = useMemo(() => {
    if (!quote || !amount) return '';

    const quotedToken = mode === 'exact-in' ? otherToken(inputToken) : inputToken;
    const quotedTokenDecimals = quotedToken === 'dydx' ? DYDX_DECIMALS : USDC_DECIMALS;
    const quotedTokenAmount = mode === 'exact-in' ? quote.amountOut : quote.amountIn;

    return formatUnits(BigInt(quotedTokenAmount), quotedTokenDecimals);
  }, [quote, inputToken, mode, amount]);

  const [from, to] = mode === 'exact-in' ? [amount, quotedAmount] : [quotedAmount, amount];

  const priceImpact = useMemo(() => {
    if (!quote || !amount) return undefined;

    return quote.swapPriceImpactPercent ? Number(quote.swapPriceImpactPercent) : undefined;
  }, [quote, amount]);

  const notify = useCustomNotification();

  const onSwapComplete = () => {
    setIsSwapSubmitting(false);
    appQueryClient.invalidateQueries({
      queryKey: ['validator', 'accountBalances'],
      exact: false,
    });
    setAmount('');
    notify({
      title: 'Swap success',
      body: 'Your swap was successful',
    });
  };

  const onSwap = async () => {
    if (!quote) {
      return;
    }

    setIsSwapSubmitting(true);
    try {
      const userAddresses = getUserAddressesForRoute(
        quote,
        // Don't need source account for swaps
        undefined,
        nobleAddress,
        dydxAddress,
        osmosisAddress,
        neutronAddress
      );

      await skipClient.executeRoute({
        route: quote,
        userAddresses,
        onTransactionCompleted: async ({ chainId, txHash, status }) => {
          console.log('TX completed!', chainId, txHash, status);
          onSwapComplete();
        },
        onTransactionBroadcast: async ({ txHash, chainId }) => {
          console.log('tx broadcast:', txHash, chainId);
        },
        onTransactionSigned: async () => {
          console.log('tx signed');
        },
      });
    } catch (e) {
      setIsSwapSubmitting(false);
      notify({
        title: 'There was an error with your swap',
      });
    }
  };

  return (
    <div tw="flex flex-col gap-1">
      <div tw="flex flex-col gap-0.25">
        <div tw="relative flex flex-col gap-0.25 rounded-0.5 bg-color-layer-4 p-1">
          <div tw="flex justify-between">
            <div tw="text-color-text-0 font-small-medium">From</div>
            <div tw="flex items-center gap-0.375 text-color-layer-7 font-small-medium">
              <CardHolderIcon />
              {tokenBalances.inputBalance.formatted ? (
                <Output
                  value={tokenBalances.inputBalance.formatted}
                  type={OutputType.CompactNumber}
                  slotRight={` ${getTokenLabel(inputToken)}`}
                />
              ) : (
                `- ${getTokenLabel(inputToken)}`
              )}
            </div>
          </div>

          <div tw="flex items-center justify-between gap-0.5">
            <$Input
              tw="bg-[unset] font-large-bold"
              $isLoading={mode === 'exact-out' && (isLoading || isPlaceholderData)}
              type="text"
              placeholder="0"
              value={from}
              onChange={onValueChange('exact-in')}
            />
            <TokenLogo token={inputToken} />
          </div>

          <div
            tw="absolute bottom-0 left-[50%] rounded-0.75 bg-color-layer-3 p-0.25 hover:opacity-90"
            style={{ transform: 'translateX(-50%) translateY(50%)' }}
          >
            <button
              onClick={onSwitchTokens}
              aria-label="Switch"
              type="button"
              style={{ transform: 'rotate(90deg)' }}
              tw="flex items-center justify-center rounded-0.5 bg-color-accent-faded p-0.375"
            >
              <ArrowIcon tw="h-1.25 w-1.25 text-color-accent" />
            </button>
          </div>
        </div>

        <div tw="flex flex-col gap-0.25 rounded-0.5 border border-solid border-color-layer-4 p-1">
          <div tw="flex justify-between">
            <div tw="text-color-text-0 font-small-medium">To</div>
            <div tw="flex items-center gap-0.375 text-color-layer-7 font-small-medium">
              <CardHolderIcon />
              {tokenBalances.outputBalance.formatted ? (
                <Output
                  value={tokenBalances.outputBalance.formatted}
                  type={OutputType.CompactNumber}
                  slotRight={` ${getTokenLabel(otherToken(inputToken))}`}
                />
              ) : (
                `- ${getTokenLabel(otherToken(inputToken))}`
              )}
            </div>
          </div>
          <div tw="flex items-center justify-between gap-0.5">
            <$Input
              tw="bg-[unset] font-large-bold"
              $isLoading={mode === 'exact-in' && (isLoading || isPlaceholderData)}
              type="text"
              placeholder="0"
              value={to}
              onChange={onValueChange('exact-out')}
            />
            <TokenLogo token={otherToken(inputToken)} />
          </div>
        </div>
      </div>

      {onboardingState !== OnboardingState.AccountConnected ? (
        <OnboardingTriggerButton size={ButtonSize.BasePlus} />
      ) : error ? (
        <div tw="flex h-3 justify-center rounded-0.75 border border-solid border-color-layer-4 p-0.75">
          <div tw="flex items-center gap-0.5 leading-5">
            <WarningFilled tw="h-[15.6px] w-[17.3px] text-red" />
            <div tw="text-base text-color-text-0">No available routes</div>
          </div>
        </div>
      ) : (
        <Button
          tw="h-3 p-0.75"
          state={
            !quote || !hasSufficientBalance
              ? ButtonState.Disabled
              : isSwapSubmitting
                ? ButtonState.Loading
                : ButtonState.Default
          }
          disabled={!quote || !hasSufficientBalance}
          onClick={onSwap}
          action={ButtonAction.Primary}
        >
          <div tw="text-base leading-5">
            {hasSufficientBalance ? 'Swap' : 'Insufficient balance'}
          </div>
        </Button>
      )}

      <$Accordion
        triggerRotation={90}
        triggerIcon={
          <div tw="flex items-center">
            <CaretDown tw="h-0.375 text-color-text-0" />
          </div>
        }
        items={[
          {
            header: <ExchangeRate usdcPerDydx={usdcPerDydx} priceImpact={priceImpact} />,
            content: (
              <QuoteDetails isLoading={isLoading || isPlaceholderData} priceImpact={priceImpact} />
            ),
          },
        ]}
      />
    </div>
  );
};

const QuoteDetails = ({ priceImpact, isLoading }: { priceImpact?: number; isLoading: boolean }) => {
  return (
    <div
      tw="flex flex-col gap-0.5 py-0.625 leading-5 text-color-text-0 font-small-medium"
      style={{ opacity: isLoading ? 0.6 : 1 }}
    >
      <div tw="flex items-center justify-between gap-0.5">
        <div tw="flex items-center gap-0.375">
          <div>Price impact</div>
          {/* TODO: add copy for price impact helper text */}
          <WithTooltip tooltipString="Price impact helper text here">
            <Icon iconName={IconName.HelpCircle} tw="h-0.625 w-0.625" />
          </WithTooltip>
        </div>
        <div>
          {priceImpact ? (
            <Output tw="inline" value={priceImpact / 100} type={OutputType.Percent} />
          ) : (
            '-'
          )}
        </div>
      </div>

      <div tw="flex items-center justify-between gap-0.5">
        <div tw="flex items-center gap-0.375">
          <div>Max slippage</div>
          {/* TODO: add copy for slippage helper text */}
          <WithTooltip tooltipString="Slippage helper text here">
            <Icon iconName={IconName.HelpCircle} tw="h-0.625 w-0.625" />
          </WithTooltip>
        </div>
        <div>
          <Output tw="inline" value="0.005" type={OutputType.Percent} />
        </div>
      </div>
    </div>
  );
};

const ExchangeRate = ({
  usdcPerDydx,
  priceImpact,
}: {
  usdcPerDydx?: number;
  priceImpact?: number;
}) => {
  if (!priceImpact && !usdcPerDydx) {
    return <LoadingDots />;
  }

  if (!priceImpact || priceImpact < 0.5) {
    return (
      <div tw="font-medium text-color-text-1">
        <Output
          tw="inline"
          value={usdcPerDydx}
          type={OutputType.CompactNumber}
          slotLeft="1 dYdX = "
          slotRight=" USDC"
        />
      </div>
    );
  }

  return (
    <div>
      <WarningFilled tw="text-color-warning" />
      <div>High price impact ({priceImpact / 100})</div>
    </div>
  );

  //   if (value > 0.0001) {
  //   return { value, color: 'var(--color-positive)' };
  // }

  // if (value > 0.005) {
  //   return { value, color: 'var(--color-text-1)' };
  // }

  // if (value > -0.05) {
  //   return { value, color: 'var(--color-warning)' };
  // }

  // return { value, color: 'var(--color-negative)' };

  return null;
};

const $Input = styled.input<{ hasError?: boolean; $isLoading: boolean }>`
  flex: 1;
  ${tw`min-w-0 flex-1 text-color-text-2 outline-none font-extra-medium`};
  ${({ hasError }) => hasError && tw`text-color-error`};
  opacity: ${({ $isLoading }) => ($isLoading ? '0.4' : '1')};
  background-color: var(--deposit-dialog-amount-bgColor, var(--color-layer-4));
  text-overflow: ellipsis;
`;

const $Accordion = styled(Accordion)`
  --accordion-paddingX: 0rem;
  --accordion-paddingY: 0rem;
`;

const TokenLogo = ({ token }: { token: 'usdc' | 'dydx' }) => {
  if (token === 'usdc') {
    return (
      <div tw="relative h-1.5 w-1.5">
        <UsdcLogo tw="h-1.5 w-1.5" />
        <DydxLogo tw="absolute -bottom-0.125 -right-0.125 h-0.75 w-0.75 rounded-[99%] border-2 border-solid border-color-layer-4" />
      </div>
    );
  }

  return (
    <div tw="relative h-1.5 w-1.5">
      <DydxLogo tw="h-1.5 w-1.5" />
      <DydxLogo tw="absolute -bottom-0.125 -right-0.125 h-0.75 w-0.75 rounded-[99%] border-2 border-solid border-color-layer-4" />
    </div>
  );
};
