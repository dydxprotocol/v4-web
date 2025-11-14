import { EventHandler, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { ArrowDownIcon } from '@radix-ui/react-icons';
import { capitalize } from 'lodash';
import { SyntheticInputEvent } from 'react-number-format/types/types';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits, parseUnits } from 'viem';

import { OnboardingState } from '@/constants/account';
import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonState,
  ButtonStyle,
} from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DYDX_DECIMALS, USDC_DECIMALS } from '@/constants/tokens';

import { useSwapQuote } from '@/hooks/swap/useSwapQuote';
import { useDebounce } from '@/hooks/useDebounce';
import { useStringGetter } from '@/hooks/useStringGetter';

import CardHolderIcon from '@/icons/card-holder.svg';
import CaretDown from '@/icons/caret-down.svg';
import DydxLogo from '@/icons/dydx-protocol.svg';
import ExchangeIcon from '@/icons/exchange.svg';
import GasIcon from '@/icons/gas.svg';
import UsdcLogo from '@/icons/usdc-inverted.svg';
import WarningFilled from '@/icons/warning-filled.svg';

import { Accordion } from '@/components/Accordion';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState, getSubaccountFreeCollateral } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { selectHasPendingSwaps } from '@/state/swapSelectors';
import { addSwap } from '@/state/swaps';

import { escapeRegExp, numericValueRegex } from '@/lib/inputUtils';
import { BIG_NUMBERS } from '@/lib/numbers';

type SwapMode = 'exact-in' | 'exact-out';
function otherToken(currToken: 'usdc' | 'dydx') {
  return currToken === 'usdc' ? 'dydx' : 'usdc';
}

function getTokenLabel(token: 'usdc' | 'dydx') {
  return token === 'usdc' ? 'USDC' : 'dYdX';
}

const SWAP_SLIPPAGE_PERCENT = '0.50'; // 0.50% (50 bps)
export const Swap = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const parentSubaccountUsdcBalance = useAppSelector(getSubaccountFreeCollateral);
  const hasPendingSwap = useAppSelector(selectHasPendingSwaps);
  const onboardingState = useAppSelector(getOnboardingState);
  const { chainTokenAmount: nativeTokenBalance } = useAppSelector(BonsaiCore.account.balances.data);

  const [inputToken, setInputToken] = useState<'dydx' | 'usdc'>('usdc');
  const [mode, setMode] = useState<SwapMode>('exact-in');
  const [amount, setAmount] = useState('');
  const [isToInputFocused, setIsToInputFocused] = useState(false);
  const [isFromInputFocused, setIsFromInputFocused] = useState(false);

  const tokenBalances = useMemo(() => {
    const dydx = {
      rawBalance: parseUnits(nativeTokenBalance ?? '0', DYDX_DECIMALS),
      formatted: Math.max(0, Number(nativeTokenBalance ?? 0)).toFixed(2),
    };
    const usdc = {
      rawBalance: parseUnits(`${parentSubaccountUsdcBalance ?? 0}`, USDC_DECIMALS),
      formatted: Math.max(0, parentSubaccountUsdcBalance ?? 0).toFixed(2),
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
  }, [nativeTokenBalance, parentSubaccountUsdcBalance, inputToken]);

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

  const setMaxAmount = (m: SwapMode) => {
    if (m === 'exact-in') {
      setAmount(tokenBalances.inputBalance.formatted);
    } else {
      setAmount(tokenBalances.outputBalance.formatted);
    }
    setMode(m);
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
    const formattedQuotedTokenAmount = formatUnits(BigInt(quotedTokenAmount), quotedTokenDecimals);

    return Number(formattedQuotedTokenAmount).toFixed(2);
  }, [quote, inputToken, mode, amount]);

  const [from, to] = mode === 'exact-in' ? [amount, quotedAmount] : [quotedAmount, amount];

  const priceImpact = useMemo(() => {
    if (!quote || !amount) return undefined;

    return quote.swapPriceImpactPercent ? Number(quote.swapPriceImpactPercent) : undefined;
  }, [quote, amount]);

  const gas = useMemo(() => {
    return (
      quote?.estimatedFees?.reduce(
        (acc, fee) => acc.plus(fee.usdAmount ?? '0'),
        BIG_NUMBERS.ZERO
      ) ?? BIG_NUMBERS.ZERO
    );
  }, [quote]);

  // const onSwapComplete = (txHash: string) => {
  //   appQueryClient.invalidateQueries({
  //     queryKey: ['validator', 'accountBalances'],
  //     exact: false,
  //   });
  //   setAmount('');
  //   const inputTokenLabel = getTokenLabel(inputToken);
  //   const outputTokenLabel = getTokenLabel(otherToken(inputToken));
  //   const inputAmount = Number(
  //     formatUnits(
  //       BigInt(quote?.amountIn ?? '0'),
  //       inputToken === 'usdc' ? USDC_DECIMALS : DYDX_DECIMALS
  //     )
  //   );
  //   const outputAmount = Number(
  //     formatUnits(
  //       BigInt(quote?.amountOut ?? '0'),
  //       inputToken === 'dydx' ? USDC_DECIMALS : DYDX_DECIMALS
  //     )
  //   );
  //   const inputLabel = `${inputAmount.toFixed(2)} ${inputTokenLabel}`;
  //   const outputLabel = `${outputAmount.toFixed(2)} ${outputTokenLabel}`;
  //   notify(
  //     {
  //       title: stringGetter({ key: STRING_KEYS.SWAP_SUCCESS }),
  //       renderCustomBody({ isToast, notification }) {
  //         return (
  //           <Toast
  //             isToast={isToast}
  //             notification={notification}
  //             slotTitle={<span tw="text-color-success">Swap Success</span>}
  //             slotIcon={<ExchangeIcon />}
  //             slotDescription={
  //               <div tw="flex flex-wrap">
  //                 <span>
  //                   {stringGetter({
  //                     key: STRING_KEYS.SWAP_SUCCESS_DESCRIPTION,
  //                     params: { INPUT_LABEL: inputLabel, OUTPUT_LABEL: outputLabel },
  //                   })}
  //                 </span>
  //                 <Button
  //                   tw="h-fit p-0 text-color-accent font-small-book"
  //                   buttonStyle={ButtonStyle.WithoutBackground}
  //                   onClick={() => window.open(`https://www.mintscan.io/dydx/tx/${txHash}`)}
  //                 >
  //                   View Transaction
  //                 </Button>
  //               </div>
  //             }
  //           />
  //         );
  //       },
  //     },
  //     {
  //       id: `swap`,
  //     }
  //   );
  // };

  const onSwap = async () => {
    if (!quote) {
      return;
    }
    const swapId = `swap-${crypto.randomUUID()}`;
    dispatch(addSwap({ swap: { id: swapId, route: quote, status: 'pending' } }));
  };

  return (
    <div tw="flex flex-col gap-1">
      <div tw="relative flex flex-col gap-0.25">
        <$InputContainer
          $isFocused={isFromInputFocused}
          tw="flex flex-col gap-0.25 rounded-0.5 bg-color-layer-4 p-1"
        >
          <div tw="flex justify-between">
            <div tw="text-color-text-0 font-small-medium">From</div>
            <Button
              buttonStyle={ButtonStyle.WithoutBackground}
              tw="flex h-fit items-center gap-0.375 p-0 text-color-layer-7 font-small-medium"
              onClick={() => setMaxAmount('exact-in')}
            >
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
            </Button>
          </div>

          <div tw="flex items-center justify-between gap-0.5">
            <$Input
              tw="bg-[unset] font-large-bold"
              $isLoading={mode === 'exact-out' && (isLoading || isPlaceholderData)}
              type="text"
              placeholder="0"
              value={from}
              onChange={onValueChange('exact-in')}
              onFocus={() => setIsFromInputFocused(true)}
              onBlur={() => setIsFromInputFocused(false)}
            />
            <TokenLogo token={inputToken} />
          </div>
        </$InputContainer>

        <$SwapButton
          tw="absolute left-1/2 top-1/2 rounded-0.75 border-4 border-color-layer-3 bg-color-layer-4 p-0.5"
          shape={ButtonShape.Square}
          action={ButtonAction.Base}
          onClick={onSwitchTokens}
        >
          <ArrowDownIcon tw="h-1.25 w-1.25" />
        </$SwapButton>

        <$InputContainer
          $isFocused={isToInputFocused}
          tw="flex flex-col gap-0.25 rounded-0.5 border border-solid border-color-layer-4 p-1"
        >
          <div tw="flex justify-between">
            <div tw="text-color-text-0 font-small-medium">To</div>
            <Button
              onClick={() => setMaxAmount('exact-out')}
              buttonStyle={ButtonStyle.WithoutBackground}
              tw="flex h-fit items-center gap-0.375 p-0 text-color-layer-7 font-small-medium"
            >
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
            </Button>
          </div>
          <div tw="flex items-center justify-between gap-0.5">
            <$Input
              tw="bg-[unset] font-large-bold"
              $isLoading={mode === 'exact-in' && (isLoading || isPlaceholderData)}
              type="text"
              placeholder="0"
              value={to}
              onChange={onValueChange('exact-out')}
              onFocus={() => setIsToInputFocused(true)}
              onBlur={() => setIsToInputFocused(false)}
            />
            <TokenLogo token={otherToken(inputToken)} />
          </div>
        </$InputContainer>
      </div>

      {onboardingState !== OnboardingState.AccountConnected ? (
        <OnboardingTriggerButton size={ButtonSize.BasePlus} />
      ) : error ? (
        <div tw="flex h-3 justify-center rounded-0.75 border border-solid border-color-layer-4 p-0.75">
          <div tw="flex items-center gap-0.5 leading-5">
            <WarningFilled tw="h-[15.6px] w-[17.3px] text-red" />
            <div tw="text-base text-color-text-0">{capitalize(error.message)}</div>
          </div>
        </div>
      ) : (
        <Button
          tw="h-3 p-0.75"
          state={
            !quote || !hasSufficientBalance
              ? ButtonState.Disabled
              : hasPendingSwap
                ? ButtonState.Loading
                : ButtonState.Default
          }
          disabled={!quote || !hasSufficientBalance}
          onClick={onSwap}
          action={ButtonAction.Primary}
        >
          <div tw="text-base leading-5">
            {hasSufficientBalance
              ? stringGetter({ key: STRING_KEYS.SWAP })
              : stringGetter({ key: STRING_KEYS.INSUFFICIENT_BALANCE })}
          </div>
        </Button>
      )}

      <$Accordion
        triggerRotation={180}
        triggerIcon={
          <div tw="flex items-center">
            <CaretDown tw="h-0.375 text-color-text-0" />
          </div>
        }
        items={[
          {
            header: (
              <ExchangeRate
                gas={gas}
                selectedToken={inputToken}
                usdcPerDydx={usdcPerDydx}
                priceImpact={priceImpact}
              />
            ),
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
  const stringGetter = useStringGetter();

  return (
    <div
      tw="flex flex-col gap-0.5 py-0.625 leading-5 text-color-text-0 font-small-medium"
      style={{ opacity: isLoading ? 0.6 : 1 }}
    >
      <div tw="flex items-center justify-between gap-0.5">
        <div tw="flex items-center gap-0.375">
          <div>{stringGetter({ key: STRING_KEYS.PRICE_IMPACT })}</div>
          {/* TODO: add copy for price impact helper text */}
          <WithTooltip tooltip="price-impact">
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
          <div>{stringGetter({ key: STRING_KEYS.MAX_SLIPPAGE })}</div>
          <WithTooltip tooltip="max-slippage">
            <Icon iconName={IconName.HelpCircle} tw="h-0.625 w-0.625" />
          </WithTooltip>
        </div>
        <div>
          <Output
            tw="inline"
            value={Number(SWAP_SLIPPAGE_PERCENT) / 100}
            type={OutputType.Percent}
          />
        </div>
      </div>
    </div>
  );
};

const ExchangeRate = ({
  usdcPerDydx,
  priceImpact,
  selectedToken,
  gas,
}: {
  usdcPerDydx?: number;
  priceImpact?: number;
  selectedToken: 'usdc' | 'dydx';
  gas: BigNumber;
}) => {
  const stringGetter = useStringGetter();
  const exchangeRate = useMemo(() => {
    return selectedToken === 'dydx' ? usdcPerDydx : 1 / (usdcPerDydx ?? 1);
  }, [selectedToken, usdcPerDydx]);
  const nonSelectedToken = selectedToken === 'dydx' ? 'usdc' : 'dydx';

  return !usdcPerDydx ? (
    <LoadingDots />
  ) : (
    <div tw="flex w-full justify-between text-small">
      <div tw="flex items-center gap-0.25">
        {priceImpact && priceImpact >= 0.5 ? (
          <WithTooltip tooltip="price-impact-warning">
            <WarningFilled tw="text-color-warning" />
            <Output
              tw="text-color-warning"
              value={priceImpact}
              type={OutputType.CompactNumber}
              slotLeft={`${stringGetter({ key: STRING_KEYS.HIGH_PRICE_IMPACT })} (`}
              slotRight="%)"
            />
          </WithTooltip>
        ) : (
          <>
            <ExchangeIcon />
            <Output
              value={exchangeRate}
              type={OutputType.CompactNumber}
              slotLeft={`1 ${getTokenLabel(selectedToken)} = `}
              slotRight={` ${getTokenLabel(nonSelectedToken)}`}
            />
          </>
        )}
      </div>
      <div tw="flex items-center gap-0.25">
        <GasIcon />
        <Output value={gas} type={OutputType.CompactNumber} slotLeft="$" />
      </div>
    </div>
  );
};

const $InputContainer = styled.div<{ $isFocused: boolean }>`
  ${({ $isFocused }) => $isFocused && 'background-color: rgba(255, 255, 255, 0.03);'};
  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }
`;

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

const $SwapButton = styled(Button)`
  transform: translate(-50%, -50%);
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
