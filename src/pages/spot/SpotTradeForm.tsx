import { useMemo, useRef, useState } from 'react';

import styled from 'styled-components';

import { ButtonAction, ButtonState } from '@/constants/buttons';
import { PERCENT_DECIMALS, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { Button } from '@/components/Button';
import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { Icon, IconName } from '@/components/Icon';
import { InputProps, InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';

import { calc } from '@/lib/do';

import { QuickButtons } from './QuickButtons';
import { SpotFormInput } from './SpotFormInput';
import { SpotTabs, SpotTabVariant } from './SpotTabs';
import { StackedIcon } from './StackedIcon';

enum SpotFormType {
  BUY = 'BUY',
  SELL = 'SELL',
}

enum SpotBuyType {
  USDC = 'USDC',
  SOL = 'SOL',
}

export const SpotTradeForm = () => {
  // Constants for now, will come from state later
  const TOKEN_SYMBOL = 'FARTCOIN';
  const TOKEN_PRICE_USDC = '0.50';
  const SOL_PRICE_USDC = '100';
  const USER_TOKEN_BALANCE = '5000';
  const USER_BALANCE_USDC = '2000';
  const USER_BALANCE_SOL = '100';

  // Raw form state
  const [tradeType, setTradeType] = useState<SpotFormType>(SpotFormType.BUY);
  const [buyType, setBuyType] = useState<SpotBuyType>(SpotBuyType.SOL);
  const [size, setSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick options state
  const [quickOptionsState, setQuickOptionsState] = useState({
    [SpotFormType.SELL]: ['25', '50', '75', '100'],
    [SpotFormType.BUY]: {
      [SpotBuyType.USDC]: ['50', '100', '250', '500'],
      [SpotBuyType.SOL]: ['0.1', '0.25', '0.5', '1'],
    },
  });

  const quickOptions = useMemo(() => {
    if (tradeType === SpotFormType.BUY) {
      return quickOptionsState[SpotFormType.BUY][buyType];
    }
    return quickOptionsState[SpotFormType.SELL];
  }, [tradeType, buyType, quickOptionsState]);

  const summary = useMemo(() => {
    let effectiveSizeInUsdc: number | undefined;
    let estimatedTokenAmount: number | undefined;

    const sizeNum = parseFloat(size);
    if (!size || Number.isNaN(sizeNum) || sizeNum <= 0) {
      return { effectiveSizeInUsdc: undefined, estimatedTokenAmount: undefined };
    }

    if (tradeType === SpotFormType.SELL) {
      // For sell: size is percentage, convert to token amount, then to USDC
      const tokenAmount = (sizeNum / 100) * parseFloat(USER_TOKEN_BALANCE);
      effectiveSizeInUsdc = tokenAmount * parseFloat(TOKEN_PRICE_USDC);
      estimatedTokenAmount = tokenAmount;
    } else {
      // For buy: convert input to USDC, then calculate token amount
      if (buyType === SpotBuyType.USDC) {
        effectiveSizeInUsdc = sizeNum;
      } else {
        effectiveSizeInUsdc = sizeNum * parseFloat(SOL_PRICE_USDC);
      }
      estimatedTokenAmount = effectiveSizeInUsdc / parseFloat(TOKEN_PRICE_USDC);
    }

    return {
      effectiveSizeInUsdc,
      estimatedTokenAmount,
    };
  }, [size, tradeType, buyType]);

  const handleBuyTypeChange = (nextBuyType: SpotBuyType) => {
    setBuyType(nextBuyType);

    const currentSizeNum = Number(size);
    if (!currentSizeNum) {
      setSize('');
      return;
    }

    if (buyType === nextBuyType) return;

    const price = Number(SOL_PRICE_USDC);
    const toSol = buyType === SpotBuyType.USDC && nextBuyType === SpotBuyType.SOL;
    const factor = toSol ? 1 / price : price;
    const decimals = nextBuyType === SpotBuyType.SOL ? TOKEN_DECIMALS : USD_DECIMALS;

    setSize((currentSizeNum * factor).toFixed(decimals));
  };

  const handleQuickOptionsChange = (newOptions: string[]) => {
    setQuickOptionsState((prev) => {
      if (tradeType === SpotFormType.BUY) {
        return {
          ...prev,
          [SpotFormType.BUY]: {
            ...prev[SpotFormType.BUY],
            [buyType]: newOptions,
          },
        };
      }

      return {
        ...prev,
        [SpotFormType.SELL]: newOptions,
      };
    });
  };

  return (
    <SpotTabs
      disabled={isSubmitting}
      value={tradeType}
      onValueChange={(v) => {
        setTradeType(v as SpotFormType);
        setSize(''); // Clear size when switching trade type
      }}
      sharedContent={
        <Inner
          type={tradeType}
          buyType={buyType}
          quickOptions={quickOptions}
          onQuickOptionsChange={handleQuickOptionsChange}
          balanceUsdc={USER_BALANCE_USDC}
          balanceSol={USER_BALANCE_SOL}
          userTokenBalance={USER_TOKEN_BALANCE}
          tokenSymbol={TOKEN_SYMBOL}
          estimatedTokenAmount={summary.estimatedTokenAmount}
          onBuyTypeChange={handleBuyTypeChange}
          size={size}
          onSizeChange={setSize}
          onSubmit={() => {
            setIsSubmitting(true);
            setTimeout(() => {
              setIsSubmitting(false);
              setSize('');
            }, 1000);
          }}
          isSubmitting={isSubmitting}
        />
      }
      items={[
        {
          label: 'Buy',
          value: SpotFormType.BUY,
          variant: SpotTabVariant.Buy,
        },
        {
          label: 'Sell',
          value: SpotFormType.SELL,
          variant: SpotTabVariant.Sell,
        },
      ]}
    />
  );
};

type InnerProps = {
  type: SpotFormType;
  buyType: SpotBuyType;
  isSubmitting?: boolean;
  size?: string;
  quickOptions?: string[];
  balanceUsdc?: string;
  balanceSol?: string;
  userTokenBalance?: string;
  tokenSymbol?: string;
  estimatedTokenAmount?: number;
  onSizeChange?: (size: string) => void;
  onQuickOptionsChange?: (options: string[]) => void;
  onBuyTypeChange?: (type: SpotBuyType) => void;
  onSubmit?: () => void;
};

const Inner = ({
  type,
  buyType,
  isSubmitting,
  size,
  quickOptions,
  balanceUsdc,
  balanceSol,
  userTokenBalance,
  tokenSymbol,
  estimatedTokenAmount,
  onSizeChange,
  onQuickOptionsChange,
  onBuyTypeChange,
  onSubmit,
}: InnerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isBuy = type === SpotFormType.BUY;

  const currentBalance = isBuy
    ? buyType === SpotBuyType.USDC
      ? balanceUsdc
      : balanceSol
    : userTokenBalance;

  const balanceLabel = isBuy
    ? buyType === SpotBuyType.USDC
      ? 'USDC Balance'
      : 'SOL Balance'
    : `${tokenSymbol} Balance`;

  const balanceOutputType = isBuy
    ? buyType === SpotBuyType.USDC
      ? OutputType.Fiat
      : OutputType.Asset
    : OutputType.Asset;

  const handleInputChange = ({ formattedValue }: { formattedValue: string }) => {
    onSizeChange?.(formattedValue);
  };

  const handleQuickOptionSelect = (val: string) => {
    onSizeChange?.(val);
  };

  const inputConfig = calc<InputProps | null>(() => {
    if (type === SpotFormType.BUY && buyType === SpotBuyType.SOL) {
      return {
        decimals: TOKEN_DECIMALS,
        type: InputType.Number,
        onInput: handleInputChange,
      };
    }

    if (type === SpotFormType.BUY && buyType === SpotBuyType.USDC) {
      return {
        decimals: USD_DECIMALS,
        type: InputType.Currency,
        onInput: handleInputChange,
      };
    }

    if (type === SpotFormType.SELL) {
      return {
        decimals: PERCENT_DECIMALS,
        type: InputType.Percent,
        onInput: handleInputChange,
      };
    }

    return null;
  });

  const dropdownSlotRightElement = calc(() => {
    if (type === SpotFormType.BUY) {
      return (
        <$CurrencyDropdown
          disabled={isSubmitting}
          onValueChange={(v) => {
            onBuyTypeChange?.(v as SpotBuyType);
          }}
          align="end"
          sideOffset={8}
          value={buyType}
          items={[
            {
              label: 'USDC',
              value: SpotBuyType.USDC,
              slotBefore: <StackedIcon primaryIcon={IconName.Usdc} secondaryIcon={IconName.Sol} />,
            },
            {
              label: 'SOL',
              value: SpotBuyType.SOL,
              slotBefore: <StackedIcon primaryIcon={IconName.Sol} secondaryIcon={IconName.Sol} />,
            },
          ]}
        />
      );
    }

    return null;
  });

  return (
    <div tw="flex flex-1 flex-col gap-0.75">
      {currentBalance && (
        <div tw="row justify-between gap-1">
          <span tw="whitespace-nowrap text-color-text-0 font-small-medium">{balanceLabel}</span>
          <div tw="row min-w-0 gap-[0.25rem]">
            <Icon iconName={IconName.Wallet} />
            <Output
              tw="truncate text-color-text-1 font-small-medium"
              type={balanceOutputType}
              value={currentBalance}
            />
          </div>
        </div>
      )}
      <SpotFormInput
        ref={inputRef}
        value={size ?? ''}
        label="Amount"
        slotBottom={`≈ ${estimatedTokenAmount ?? 0} ${tokenSymbol}`}
        slotRight={dropdownSlotRightElement}
        disabled={isSubmitting}
        {...inputConfig}
      />
      {!!quickOptions?.length && (
        <QuickButtons
          options={quickOptions}
          onSelect={handleQuickOptionSelect}
          onOptionsEdit={onQuickOptionsChange}
          currentValue={size}
          disabled={isSubmitting}
        />
      )}
      <Button
        tw="mt-auto"
        action={isBuy ? ButtonAction.Create : ButtonAction.Destroy}
        onClick={() => onSubmit?.()}
        state={isSubmitting ? ButtonState.Loading : ButtonState.Default}
      >
        {isBuy ? 'Buy' : 'Sell'}
      </Button>
    </div>
  );
};

const $CurrencyDropdown = styled(DropdownSelectMenu)`
  --trigger-radius: 1.5rem;
  --trigger-border: 1px solid var(--color-layer-4);
  --trigger-textColor: var(--color-text-2);
  --trigger-backgroundColor: var(--color-layer-3);
  --trigger-padding: 0.5rem;
  --trigger-open-backgroundColor: var(--color-layer-2);
  --popover-radius: 0.75rem;
  --popover-border: 1px solid var(--color-layer-5);
  --popover-origin: left right;
`;
