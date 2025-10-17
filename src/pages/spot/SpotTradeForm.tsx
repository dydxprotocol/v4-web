import { useMemo, useRef, useState } from 'react';

import { SpotBuyInputType, SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';

import { ButtonAction, ButtonState } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useSpotForm } from '@/hooks/useSpotForm';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { QuickButtons } from './QuickButtons';
import { SpotFormInput } from './SpotFormInput';
import { SpotTabs, SpotTabVariant } from './SpotTabs';

export const SpotTradeForm = () => {
  const stringGetter = useStringGetter();
  const form = useSpotForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickOptionsState, setQuickOptionsState] = useState({
    [SpotSide.SELL]: {
      [SpotSellInputType.PERCENT]: ['10', '25', '50', '100'],
      [SpotSellInputType.SOL]: ['0.1', '0.25', '0.5', '1'],
    },
    [SpotSide.BUY]: {
      [SpotBuyInputType.USD]: ['50', '100', '250', '500'],
      [SpotBuyInputType.SOL]: ['0.1', '0.25', '0.5', '1'],
    },
  });

  const quickOptions = useMemo(() => {
    if (form.state.side === SpotSide.BUY) {
      return quickOptionsState[SpotSide.BUY][form.state.buyInputType];
    }
    return quickOptionsState[SpotSide.SELL][form.state.sellInputType];
  }, [form.state.side, form.state.buyInputType, form.state.sellInputType, quickOptionsState]);

  const validationConfig = useMemo(() => {
    if (form.state.side === SpotSide.BUY) {
      return { min: 0, decimalScale: 2 };
    }
    return form.state.sellInputType === SpotSellInputType.PERCENT
      ? { min: 0, max: 100, decimalScale: 2 }
      : { min: 0, decimalScale: 2 };
  }, [form.state.side, form.state.sellInputType]);

  const handleInputTypeChange = (side: SpotSide, type: SpotBuyInputType | SpotSellInputType) => {
    if (side === SpotSide.BUY) {
      const newType = type as SpotBuyInputType;

      // Use summary values to convert between input types
      const newSize =
        newType === SpotBuyInputType.USD
          ? (form.summary.estimatedUsdCost?.toString() ?? '')
          : (form.summary.estimatedSolCost?.toString() ?? '');

      form.actions.setBuyInputType(newType);
      form.actions.setSize(newSize);
    } else {
      const newType = type as SpotSellInputType;

      // Use summary values to convert between input types
      let newSize = '';
      if (newType === SpotSellInputType.SOL) {
        newSize = form.summary.estimatedSolCost?.toString() ?? '';
      } else if (newType === SpotSellInputType.PERCENT) {
        // Calculate percent from estimated token amount
        if (form.summary.estimatedTokenAmount && form.inputData.userTokenBalance) {
          const percent =
            (form.summary.estimatedTokenAmount / form.inputData.userTokenBalance) * 100;
          newSize = percent.toString();
        }
      }

      form.actions.setSellInputType(newType);
      form.actions.setSize(newSize);
    }
  };

  const handleQuickOptionsChange = (newOptions: string[]) => {
    if (form.state.side === SpotSide.BUY) {
      setQuickOptionsState((prev) => ({
        ...prev,
        [SpotSide.BUY]: {
          ...prev[SpotSide.BUY],
          [form.state.buyInputType]: newOptions,
        },
      }));
    } else {
      setQuickOptionsState((prev) => ({
        ...prev,
        [SpotSide.SELL]: {
          ...prev[SpotSide.SELL],
          [form.state.sellInputType]: newOptions,
        },
      }));
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <SpotTabs
      tw="p-1"
      disabled={isSubmitting}
      value={form.state.side}
      onValueChange={(v) => {
        form.actions.setSide(v as SpotSide);
        // Size is cleared by the reducer when switching sides
      }}
      sharedContent={
        <div tw="flex flex-1 flex-col gap-0.75">
          <SpotFormInput
            ref={inputRef}
            value={form.state.size}
            disabled={isSubmitting}
            onInput={({ formattedValue }: { formattedValue: string }) =>
              form.actions.setSize(formattedValue)
            }
            balances={{
              sol: form.inputData.userSolBalance,
              token: form.inputData.userTokenBalance,
            }}
            inputType={
              form.state.side === SpotSide.BUY ? form.state.buyInputType : form.state.sellInputType
            }
            onInputTypeChange={handleInputTypeChange}
            side={form.state.side}
            tokenAmount={form.summary.estimatedTokenAmount ?? 0}
            tokenSymbol={form.inputData.tokenSymbol}
          />
          <QuickButtons
            options={quickOptions}
            onSelect={(val: string) => form.actions.setSize(val)}
            onOptionsEdit={handleQuickOptionsChange}
            currentValue={form.state.size}
            disabled={isSubmitting}
            validation={validationConfig}
          />
          <Button
            tw="mt-auto"
            action={form.state.side === SpotSide.BUY ? ButtonAction.Create : ButtonAction.Destroy}
            onClick={() => {
              setIsSubmitting(true);
              // TODO: Implement actual API call with form.summary.payload
              setTimeout(() => {
                setIsSubmitting(false);
                form.actions.reset();
              }, 1000);
            }}
            state={isSubmitting ? ButtonState.Loading : ButtonState.Default}
          >
            {form.state.side === SpotSide.BUY
              ? stringGetter({ key: STRING_KEYS.BUY })
              : stringGetter({ key: STRING_KEYS.SELL })}
          </Button>
        </div>
      }
      items={[
        {
          label: stringGetter({ key: STRING_KEYS.BUY }),
          value: SpotSide.BUY,
          variant: SpotTabVariant.Buy,
        },
        {
          label: stringGetter({ key: STRING_KEYS.SELL }),
          value: SpotSide.SELL,
          variant: SpotTabVariant.Sell,
        },
      ]}
    />
  );
};
