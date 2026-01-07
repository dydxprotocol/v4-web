import { useCallback, useMemo, useRef } from 'react';

import { SpotBuyInputType, SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';
import { BonsaiCore } from '@/bonsai/ontology';

import { SpotWalletStatus } from '@/constants/account';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useSpotForm } from '@/hooks/useSpotForm';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { ValidationAlertMessage } from '@/components/ValidationAlert';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSpotQuickOptions } from '@/state/appUiConfigs';
import { getSpotQuickOptions } from '@/state/appUiConfigsSelectors';

import { mapIfPresent } from '@/lib/do';

import { QuickButtonProps, QuickButtons } from './QuickButtons';
import { SpotFormInput } from './SpotFormInput';
import { SpotTabs, SpotTabVariant } from './SpotTabs';

export const SpotTradeForm = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const form = useSpotForm();
  const tokenMetadata = useAppSelector(BonsaiCore.spot.tokenMetadata.data);
  const quickOptionsState = useAppSelector(getSpotQuickOptions);

  const inputRef = useRef<HTMLInputElement>(null);

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
    const { side, buyInputType, sellInputType } = form.state;

    if (side === SpotSide.BUY && buyInputType === SpotBuyInputType.USD) {
      return { prefix: '$' };
    }

    if (side === SpotSide.BUY && buyInputType === SpotBuyInputType.SOL) {
      return { slotRight: <Icon iconName={IconName.SolanaSimple} size="0.875rem" /> };
    }

    if (side === SpotSide.SELL && sellInputType === SpotSellInputType.USD) {
      return { prefix: '$' };
    }

    if (side === SpotSide.SELL && sellInputType === SpotSellInputType.PERCENT) {
      return { suffix: '%' };
    }

    return {};
  }, [form.state]);

  const handleQuickOptionsChange = useCallback(
    (newOptions: string[]) => {
      dispatch(
        setSpotQuickOptions({
          side: form.state.side,
          inputType:
            form.state.side === SpotSide.BUY ? form.state.buyInputType : form.state.sellInputType,
          options: newOptions,
        })
      );
    },
    [dispatch, form.state.buyInputType, form.state.sellInputType, form.state.side]
  );

  return (
    <SpotTabs
      tw="p-1"
      disabled={form.isPending || form.inputData.walletStatus !== SpotWalletStatus.Connected}
      value={form.state.side}
      onValueChange={(v) => {
        form.actions.setSide(v as SpotSide);
      }}
      sharedContent={
        <div tw="flex flex-1 flex-col gap-0.75">
          {!form.inputData.isAsyncDataReady ? (
            <LoadingSpace />
          ) : (
            <>
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
                  form.state.side === SpotSide.BUY
                    ? form.state.buyInputType
                    : form.state.sellInputType
                }
                onInputTypeChange={form.handleInputTypeChange}
                onBalanceClick={(value) => form.actions.setSize(value)}
                side={form.state.side}
                tokenAmount={form.summary.amounts?.token ?? 0}
                tokenSymbol={tokenMetadata?.symbol ?? ''}
                showDeposit={form.inputData.walletStatus === SpotWalletStatus.Connected}
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
              {form.inputData.walletStatus === SpotWalletStatus.Disconnected ? (
                <OnboardingTriggerButton tw="mt-auto" size={ButtonSize.Base} />
              ) : (
                <Button
                  tw="mt-auto"
                  action={
                    form.state.side === SpotSide.BUY ? ButtonAction.Create : ButtonAction.Destroy
                  }
                  onClick={form.submitTransaction}
                  disabled={!form.canSubmit}
                  state={{
                    isLoading: form.isPending,
                    isDisabled: !form.canSubmit,
                  }}
                >
                  {form.state.side === SpotSide.BUY
                    ? stringGetter({ key: STRING_KEYS.BUY })
                    : stringGetter({ key: STRING_KEYS.SELL })}
                </Button>
              )}
            </>
          )}
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
