import { EventHandler, useMemo, useState } from 'react';

import { ArrowDownIcon } from '@radix-ui/react-icons';
import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import { formatUnits, parseUnits } from 'viem';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonState } from '@/constants/buttons';
import { DYDX_DECIMALS, USDC_DECIMALS } from '@/constants/tokens';

import { useSwapQuote } from '@/hooks/swap/useSwapQuote';
import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useDebounce } from '@/hooks/useDebounce';

import CardHolderIcon from '@/icons/card-holder.svg';
import CaretDown from '@/icons/caret-down.svg';
import DydxLogo from '@/icons/dydx-protocol.svg';
import GasIcon from '@/icons/gas.svg';
import RefreshIcon from '@/icons/refresh.svg';
import UsdcLogo from '@/icons/usdc.svg';
import WarningFilled from '@/icons/warning-filled.svg';

import { Accordion } from '@/components/Accordion';
import { Button } from '@/components/Button';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Output, OutputType } from '@/components/Output';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';
import { getUserAddressesForRoute } from '@/views/dialogs/TransferDialogs/utils';

import { getOnboardingState } from '@/state/accountSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { useAppSelector } from '@/state/appTypes';

import { escapeRegExp, numericValueRegex } from '@/lib/inputUtils';

const SWAP_SLIPPAGE_PERCENT = '0.50'; // 0.50% (50 bps)

type SwapInputDirection = 'to' | 'from';
type SwapToken = 'usdc' | 'dydx';
type SwapTokenData = {
  token: SwapToken;
  balance: number;
};

function getTokenLabel(token: SwapToken) {
  return token === 'usdc' ? 'USDC' : 'dYdX';
}

const TokenLogo = ({ token }: { token: SwapToken }) => {
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

type SwapInputProps = {
  className?: string;
  direction: SwapInputDirection;
  token: SwapTokenData;
  value: string;
  onValueChange?: EventHandler<SyntheticInputEvent>;
};

const SwapInput = ({ className, direction, token, value, onValueChange }: SwapInputProps) => {
  const directionLabel = direction === 'to' ? 'To' : 'From';

  return (
    <div className={className} tw="flex flex-col gap-0.25 rounded-0.5 p-1 text-color-text-0">
      <div tw="flex w-full items-center justify-between">
        <span tw="text-small">{directionLabel}</span>
        <div tw="flex items-center gap-0.5">
          <CardHolderIcon />
          <Output
            tw="text-small"
            value={token.balance}
            type={OutputType.CompactNumber}
            slotRight={` ${getTokenLabel(token.token)}`}
          />
        </div>
      </div>
      <div tw="flex w-full items-center justify-between">
        <input
          tw="bg-[unset] outline-none font-large-bold"
          disabled={!onValueChange}
          type="text"
          placeholder="0"
          value={value}
          onChange={onValueChange}
        />
        <TokenLogo token={token.token} />
      </div>
    </div>
  );
};

type SwapInputsProps = {
  toValue: string;
  fromValue: string;
  toToken: SwapTokenData;
  fromToken: SwapTokenData;
  onFromValueChange: EventHandler<SyntheticInputEvent>;
  onTokenSwap: () => void;
};

const SwapInputs = ({
  toValue,
  fromValue,
  toToken,
  fromToken,
  onFromValueChange,
  onTokenSwap,
}: SwapInputsProps) => {
  return (
    <div tw="relative flex flex-col gap-0.25">
      <SwapInput
        tw="bg-color-layer-4"
        direction="from"
        token={fromToken}
        value={fromValue}
        onValueChange={onFromValueChange}
      />
      <$SwapButton
        tw="absolute left-1/2 top-1/2 rounded-0.75 border-4 border-color-layer-3 bg-color-layer-4 p-0.5"
        shape={ButtonShape.Square}
        action={ButtonAction.Base}
        onClick={onTokenSwap}
      >
        <ArrowDownIcon tw="h-1.25 w-1.25" />
      </$SwapButton>
      <SwapInput
        tw="border-solid border-color-layer-4"
        direction="to"
        token={toToken}
        value={toValue}
      />
    </div>
  );
};

const SwapFooter = ({
  usdcPerDydx,
  selectedToken,
  gas,
  priceImpact,
}: {
  usdcPerDydx: number;
  selectedToken: SwapToken;
  gas: number;
  priceImpact: number;
}) => {
  const exchangeRate = useMemo(() => {
    return selectedToken === 'dydx' ? usdcPerDydx : 1 / usdcPerDydx;
  }, [selectedToken, usdcPerDydx]);
  const otherToken = selectedToken === 'dydx' ? 'usdc' : 'dydx';

  const accordionHeader = useMemo(
    () =>
      !usdcPerDydx ? (
        <LoadingDots />
      ) : (
        <div tw="flex w-full justify-between text-small">
          <div tw="flex items-center gap-0.25">
            {priceImpact <= 0.5 ? (
              <>
                <RefreshIcon />
                <Output
                  value={exchangeRate}
                  type={OutputType.CompactNumber}
                  slotLeft={`1 ${getTokenLabel(selectedToken)} = `}
                  slotRight={` ${getTokenLabel(otherToken)}`}
                />
              </>
            ) : (
              <>
                <WarningFilled tw="text-color-warning" />
                <Output
                  tw="text-color-warning"
                  value={priceImpact / 100}
                  type={OutputType.CompactNumber}
                  slotLeft="High price impact ("
                  slotRight="%)"
                />
              </>
            )}
          </div>
          <div tw="flex items-center gap-0.25">
            <GasIcon />
            <Output value={gas} type={OutputType.CompactNumber} slotLeft="$" />
          </div>
        </div>
      ),
    [exchangeRate, gas, otherToken, priceImpact, selectedToken, usdcPerDydx]
  );
  return (
    <$Accordion
      triggerRotation={90}
      triggerIcon={
        <div tw="flex items-center">
          <CaretDown tw="h-0.375 text-color-text-0" />
        </div>
      }
      items={[{ header: accordionHeader, content: <div>Hello</div> }]}
    />
  );
};

export const Swap = () => {
  const { skipClient } = useSkipClient();
  const { nobleAddress, dydxAddress, osmosisAddress, neutronAddress } = useAccounts();
  const onboardingState = useAppSelector(getOnboardingState);
  const { nativeTokenBalance, usdcBalance } = useAccountBalance();
  const { data: priceQuote } = useSwapQuote('dydx', '1', 'exact-in');

  const [fromValue, setFromValue] = useState('');
  const [fromToken, setFromToken] = useState<SwapToken>('dydx');
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false);

  const debouncedAmount = useDebounce(fromValue);
  const {
    data: quote,
    isPlaceholderData,
    error,
  } = useSwapQuote(fromToken, debouncedAmount, 'exact-in');

  const usdcPerDydx = useMemo(() => {
    return Number(formatUnits(BigInt(priceQuote?.amountOut ?? '0'), USDC_DECIMALS));
  }, [priceQuote]);

  const toValue = useMemo(() => {
    if (!quote || isPlaceholderData) return '-';
    const decimals = fromToken === 'usdc' ? DYDX_DECIMALS : USDC_DECIMALS;
    return formatUnits(BigInt(quote.amountOut), decimals);
  }, [fromToken, isPlaceholderData, quote]);

  const { toTokenData, fromTokenData } = useMemo(() => {
    const usdcTokenData: SwapTokenData = { token: 'usdc', balance: usdcBalance };
    const dydxTokenData: SwapTokenData = { token: 'dydx', balance: nativeTokenBalance.toNumber() };

    return {
      toTokenData: fromToken === 'dydx' ? usdcTokenData : dydxTokenData,
      fromTokenData: fromToken === 'dydx' ? dydxTokenData : usdcTokenData,
    };
  }, [fromToken, usdcBalance, nativeTokenBalance]);

  const hasSufficientBalance = useMemo(() => {
    if (!quote) return true;
    const isRecievingDydx = quote.sourceAssetDenom === 'adydx';
    const decimals = isRecievingDydx ? USDC_DECIMALS : DYDX_DECIMALS;
    const inputAmount = parseUnits(quote.amountIn, decimals);
    const inputBalance = parseUnits(`${usdcBalance}`, 18);

    console.log(quote, inputAmount, inputBalance, inputAmount <= inputBalance);

    return inputAmount < inputBalance;
    // if (!quote || !fromValue) return false;

    // const inputAmount = parseUnits(
    //   quote.amountIn,
    //   quote.sourceAssetDenom === 'adydx' ? DYDX_DECIMALS : USDC_DECIMALS
    // );
    // const inputBalance =
    //   quote.sourceAssetDenom === 'adydx' ? nativeTokenBalance.toNumber() : usdcBalance;

    // if (!inputBalance) return false;

    // return inputBalance <= inputAmount;
  }, [fromValue, nativeTokenBalance, quote, usdcBalance]);

  const priceImpact = useMemo(() => Number(quote?.swapPriceImpactPercent ?? 0), [quote]);

  const onFromValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    if (numericValueRegex.test(escapeRegExp(e.target.value))) {
      setFromValue(e.target.value.toString());
    }
  };

  const onSwitchTokens = () => {
    setFromToken(fromToken === 'usdc' ? 'dydx' : 'usdc');
    setFromValue('');
  };

  const notify = useCustomNotification();

  const onSwapComplete = () => {
    setIsSwapSubmitting(false);
    appQueryClient.invalidateQueries({
      queryKey: ['validator', 'accountBalances'],
      exact: false,
    });
    setFromValue('');
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
        slippageTolerancePercent: SWAP_SLIPPAGE_PERCENT,
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
      <SwapInputs
        toValue={toValue}
        fromValue={fromValue}
        toToken={toTokenData}
        fromToken={fromTokenData}
        onFromValueChange={onFromValueChange}
        onTokenSwap={onSwitchTokens}
      />
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
      <SwapFooter
        selectedToken={fromToken}
        usdcPerDydx={usdcPerDydx}
        gas={0}
        priceImpact={priceImpact}
      />
    </div>
  );
};

const $Accordion = styled(Accordion)`
  --accordion-paddingX: 0rem;
  --accordion-paddingY: 0rem;
`;

const $SwapButton = styled(Button)`
  transform: translate(-50%, -50%);
`;
