import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SpotBuyInputType, SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';
import { BonsaiCore } from '@/bonsai/ontology';

import { ButtonAction, ButtonState } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useSpotForm } from '@/hooks/useSpotForm';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { ValidationAlertMessage } from '@/components/ValidationAlert';

import { useAppSelector } from '@/state/appTypes';

import { mapIfPresent } from '@/lib/do';

import { QuickButtonProps, QuickButtons } from './QuickButtons';
import { SpotFormInput } from './SpotFormInput';
import { SpotTabs, SpotTabVariant } from './SpotTabs';

export const SpotTradeForm = () => {
  const stringGetter = useStringGetter();
  const form = useSpotForm();
  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);

  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [form.state.side]);

  const [quickOptionsState, setQuickOptionsState] = useState({
    [SpotSide.SELL]: {
      [SpotSellInputType.PERCENT]: ['10', '25', '50', '100'],
      [SpotSellInputType.USD]: ['50', '100', '250', '500'],
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

  const currencyIndicator = useMemo((): Pick<
    QuickButtonProps,
    'prefix' | 'suffix' | 'slotRight'
  > => {
    if (form.state.side === SpotSide.BUY) {
      if (form.state.buyInputType === SpotBuyInputType.USD) {
        return { prefix: '$' };
      }
      if (form.state.buyInputType === SpotBuyInputType.SOL) {
        return { slotRight: <Icon iconName={IconName.SolanaSimple} size="0.875rem" /> };
      }
    } else {
      if (form.state.sellInputType === SpotSellInputType.USD) {
        return { prefix: '$' };
      }
      if (form.state.sellInputType === SpotSellInputType.PERCENT) {
        return { suffix: '%' };
      }
    }
    return {};
  }, [form.state.side, form.state.buyInputType, form.state.sellInputType]);

  const handleQuickOptionsChange = useCallback(
    (newOptions: string[]) => {
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
    },
    [form.state.buyInputType, form.state.sellInputType, form.state.side]
  );

  return (
    <SpotTabs
      tw="p-1"
      disabled={form.isPending}
      value={form.state.side}
      onValueChange={(v) => {
        form.actions.setSide(v as SpotSide);
      }}
      sharedContent={
        <div tw="flex flex-1 flex-col gap-0.75">
          <SpotFormInput
            ref={inputRef}
            value={form.state.size}
            disabled={form.isPending}
            onInput={({ formattedValue }: { formattedValue: string }) =>
              form.actions.setSize(formattedValue)
            }
            balances={{
              sol: form.inputData.userSolBalance ?? 0,
              token: form.inputData.userTokenBalance ?? 0,
              usd:
                mapIfPresent(
                  form.inputData.userSolBalance,
                  form.inputData.solPriceUsd,
                  (solBalance, solPrice) => solBalance * solPrice
                ) ?? 0,
            }}
            inputType={
              form.state.side === SpotSide.BUY ? form.state.buyInputType : form.state.sellInputType
            }
            onInputTypeChange={form.handleInputTypeChange}
            side={form.state.side}
            tokenAmount={form.summary.amounts?.token ?? 0}
            tokenSymbol={tokenMetadata?.symbol ?? ''}
          />
          <QuickButtons
            options={quickOptions}
            onSelect={(val) => form.actions.setSize(val)}
            onOptionsEdit={handleQuickOptionsChange}
            currentValue={form.state.size}
            disabled={form.isPending}
            validation={validationConfig}
            {...currencyIndicator}
          />
          {form.primaryAlert != null &&
            (form.primaryAlert.resources.text?.stringKey != null ||
              form.primaryAlert.resources.text?.fallback != null) && (
              <ValidationAlertMessage error={form.primaryAlert} />
            )}
          <Button
            tw="mt-auto"
            action={form.state.side === SpotSide.BUY ? ButtonAction.Create : ButtonAction.Destroy}
            onClick={form.submitTransaction}
            disabled={!form.canSubmit}
            state={
              form.isPending
                ? ButtonState.Loading
                : !form.canSubmit
                  ? ButtonState.Disabled
                  : ButtonState.Default
            }
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
