import { FormEvent, useEffect, useMemo, useState } from 'react';

import {
  AdjustIsolatedMarginFormFns,
  AdjustIsolatedMarginInputType,
  AdjustIsolatedMarginType,
} from '@/bonsai/forms/adjustIsolatedMargin';
import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import { useFormValues } from '@/bonsai/lib/forms';
import { isOperationFailure, isOperationSuccess } from '@/bonsai/lib/operationResult';
import {
  ErrorType,
  getAlertsToRender,
  getFormDisabledButtonStringKey,
} from '@/bonsai/lib/validationErrors';
import { BonsaiHelpers, BonsaiRaw } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonState,
  ButtonType,
} from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, PERCENT_DECIMALS } from '@/constants/numbers';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { GradientCard } from '@/components/GradientCard';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType, ShowSign } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { ValidationAlertMessage } from '@/components/ValidationAlert';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getOpenPositionFromId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { useDisappearingValue } from '@/lib/disappearingValue';
import { MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

type ElementProps = {
  positionId: SubaccountPosition['uniqueId'];
  onIsolatedMarginAdjustment?(): void;
};

const SIZE_PERCENT_OPTIONS = {
  '10%': '0.1',
  '25%': '0.25',
  '50%': '0.5',
  '75%': '0.75',
  '100%': '1',
};

export const AdjustIsolatedMarginForm = ({
  positionId,
  onIsolatedMarginAdjustment,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { subaccountNumber: childSubaccountNumber, market: marketId = '' } = orEmptyObj(
    useParameterizedSelector(getOpenPositionFromId, positionId)
  );

  const { tickSizeDecimals } = orEmptyObj(
    useParameterizedSelector(BonsaiHelpers.markets.createSelectMarketSummaryById, marketId)
  );

  const { errors, summary, actions, state } = useForm();

  useEffect(() => {
    actions.initializeForm(childSubaccountNumber);
  }, [actions, childSubaccountNumber]);

  const setAmount = ({ formattedValue }: { formattedValue?: string }) => {
    actions.setAmount(formattedValue ?? '');
  };

  const setPercent = (value: string) => {
    actions.setPercent(value);
  };

  const setMarginAction = (type: string) => {
    actions.setType(
      type === 'ADD' ? AdjustIsolatedMarginType.ADD : AdjustIsolatedMarginType.REMOVE
    );
  };

  const [errorMessageRaw, setErrorMessageRaw] = useDisappearingValue<string>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { transferBetweenSubaccounts } = useSubaccount();
  const onSubmit = async () => {
    setErrorMessageRaw(undefined);
    setIsSubmitting(true);

    try {
      if (summary.payload == null) {
        throw new Error('No payload found');
      }
      const result = await transferBetweenSubaccounts(summary.payload);
      if (isOperationSuccess(result)) {
        actions.initializeForm(childSubaccountNumber);
        onIsolatedMarginAdjustment?.();
      } else if (isOperationFailure(result)) {
        setErrorMessageRaw(result.errorString);
      }
    } catch (e) {
      if (e?.message != null && typeof e.message === 'string') {
        setErrorMessageRaw(e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDiffOutput = ({
    type,
    value,
    newValue,
    showSign,
    withDiff,
  }: Pick<
    Parameters<typeof DiffOutput>[0],
    'type' | 'value' | 'newValue' | 'withDiff' | 'showSign'
  >) => (
    <DiffOutput
      type={type}
      value={value}
      newValue={newValue}
      showSign={showSign}
      withDiff={withDiff}
    />
  );

  const ctaErrorAction = useMemo(() => {
    const key = getFormDisabledButtonStringKey(errors);
    return key ? stringGetter({ key }) : undefined;
  }, [errors, stringGetter]);

  const validationAlert = useMemo(() => {
    return getAlertsToRender(errors)?.[0];
  }, [errors]);

  const hasErrors = useMemo(() => {
    return errors.some((e) => e.type === ErrorType.error);
  }, [errors]);

  const {
    crossFreeCollateral,
    crossMarginUsage,
    positionLeverage,
    positionMargin,
    liquidationPrice,
  } = summary.accountBefore;
  const {
    crossFreeCollateral: crossFreeCollateralUpdated,
    crossMarginUsage: crossMarginUsageUpdated,
    positionLeverage: positionLeverageUpdated,
    positionMargin: positionMarginUpdated,
    liquidationPrice: liquidationPriceUpdated,
  } = summary.accountAfter;
  const {
    freeCollateralDiffOutput,
    marginUsageDiffOutput,
    positionMarginDiffOutput,
    leverageDiffOutput,
  } = useMemo(
    () => ({
      freeCollateralDiffOutput: renderDiffOutput({
        withDiff:
          !!crossFreeCollateralUpdated && crossFreeCollateral !== crossFreeCollateralUpdated,
        value: crossFreeCollateral,
        newValue: crossFreeCollateralUpdated,
        type: OutputType.Fiat,
      }),
      marginUsageDiffOutput: renderDiffOutput({
        withDiff: !!crossMarginUsageUpdated && crossMarginUsage !== crossMarginUsageUpdated,
        value: crossMarginUsage,
        newValue: crossMarginUsageUpdated,
        type: OutputType.Percent,
      }),
      positionMarginDiffOutput: renderDiffOutput({
        withDiff: !!positionMarginUpdated && positionMargin !== positionMarginUpdated,
        value: positionMargin,
        newValue: positionMarginUpdated,
        type: OutputType.Fiat,
      }),
      leverageDiffOutput: renderDiffOutput({
        withDiff: !!positionLeverageUpdated && positionLeverage !== positionLeverageUpdated,
        value: positionLeverage,
        newValue: positionLeverageUpdated,
        type: OutputType.Multiple,
        showSign: ShowSign.None,
      }),
    }),
    [
      crossFreeCollateral,
      crossFreeCollateralUpdated,
      crossMarginUsage,
      crossMarginUsageUpdated,
      positionLeverage,
      positionLeverageUpdated,
      positionMargin,
      positionMarginUpdated,
    ]
  );

  const formConfig =
    state.type === AdjustIsolatedMarginType.ADD
      ? {
          formLabel: stringGetter({ key: STRING_KEYS.AMOUNT_TO_ADD }),
          buttonLabel: stringGetter({ key: STRING_KEYS.ADD_MARGIN }),
          inputReceiptItems: [
            {
              key: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              value: freeCollateralDiffOutput,
            },
            {
              key: 'cross-margin-usage',
              label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
              value: marginUsageDiffOutput,
            },
          ],
          receiptItems: [
            {
              key: 'margin',
              label: stringGetter({ key: STRING_KEYS.POSITION_MARGIN }),
              value: positionMarginDiffOutput,
            },
            {
              key: 'leverage',
              label: stringGetter({ key: STRING_KEYS.POSITION_LEVERAGE }),
              value: leverageDiffOutput,
            },
          ],
        }
      : {
          formLabel: stringGetter({ key: STRING_KEYS.AMOUNT_TO_REMOVE }),
          buttonLabel: stringGetter({ key: STRING_KEYS.REMOVE_MARGIN }),
          inputReceiptItems: [
            {
              key: 'margin',
              label: stringGetter({ key: STRING_KEYS.POSITION_MARGIN }),
              value: positionMarginDiffOutput,
            },
            {
              key: 'leverage',
              label: stringGetter({ key: STRING_KEYS.POSITION_LEVERAGE }),
              value: leverageDiffOutput,
            },
          ],
          receiptItems: [
            {
              key: 'cross-free-collateral',
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              value: freeCollateralDiffOutput,
            },
            {
              key: 'cross-margin-usage',
              label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
              value: marginUsageDiffOutput,
            },
          ],
        };

  const gradientToColor = useMemo(() => {
    if (MustBigNumber(summary.inputs.amount).isZero()) {
      return 'neutral';
    }

    if (state.type === AdjustIsolatedMarginType.ADD) {
      return 'positive';
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (state.type === AdjustIsolatedMarginType.REMOVE) {
      return 'negative';
    }

    return 'neutral';
  }, [state.type, summary.inputs.amount]);

  const errorMessage = useMemo(() => {
    if (errorMessageRaw != null) {
      const parsingResult = parseTransactionError(
        'AdjustIsolatedMargin SubaccountTransfer',
        errorMessageRaw
      );
      return stringGetter({ key: parsingResult?.stringKey ?? STRING_KEYS.UNKNOWN_ERROR });
    }
    return undefined;
  }, [errorMessageRaw, stringGetter]);

  const CenterElement =
    !!validationAlert || !!errorMessage ? (
      <>
        {validationAlert && <ValidationAlertMessage error={validationAlert} />}
        {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}
      </>
    ) : (
      <GradientCard
        fromColor="neutral"
        toColor={gradientToColor}
        tw="spacedRow h-4 items-center rounded-0.5 px-1 py-0.75"
      >
        <div tw="column font-small-medium">
          <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.ESTIMATED })}</span>
          <span>{stringGetter({ key: STRING_KEYS.LIQUIDATION_PRICE })}</span>
        </div>
        <div>
          <DiffOutput
            withSubscript
            withDiff={
              !!liquidationPriceUpdated &&
              liquidationPrice !== liquidationPriceUpdated &&
              MustBigNumber(summary.inputs.amount).gt(0)
            }
            sign={NumberSign.Negative}
            layout="column"
            value={liquidationPrice}
            newValue={liquidationPriceUpdated}
            type={OutputType.Fiat}
            fractionDigits={tickSizeDecimals}
          />
        </div>
      </GradientCard>
    );

  return (
    <$Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <ToggleGroup
        size={ButtonSize.Small}
        value={state.type}
        onValueChange={setMarginAction}
        items={[
          {
            value: AdjustIsolatedMarginType.ADD,
            label: stringGetter({ key: STRING_KEYS.ADD_MARGIN }),
          },
          {
            value: AdjustIsolatedMarginType.REMOVE,
            label: stringGetter({ key: STRING_KEYS.REMOVE_MARGIN }),
          },
        ]}
      />

      <div tw="flexColumn gap-[0.56rem]">
        <$ToggleGroup
          items={objectEntries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
            label: key,
            value: MustBigNumber(value).toFixed(PERCENT_DECIMALS),
          }))}
          value={MustBigNumber(summary.inputs.percent).toFixed(PERCENT_DECIMALS)}
          onValueChange={setPercent}
          shape={ButtonShape.Rectangle}
        />

        <WithDetailsReceipt side="bottom" detailItems={formConfig.inputReceiptItems}>
          <FormInput
            type={InputType.Currency}
            label={formConfig.formLabel}
            value={
              state.amountInput.type === AdjustIsolatedMarginInputType.AMOUNT
                ? state.amountInput.amount
                : summary.inputs.amount
            }
            onInput={setAmount}
          />
        </WithDetailsReceipt>
      </div>

      {CenterElement}

      <WithDetailsReceipt detailItems={formConfig.receiptItems}>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          disabled={isSubmitting || hasErrors}
          state={
            isSubmitting
              ? ButtonState.Loading
              : hasErrors
                ? ButtonState.Disabled
                : ButtonState.Default
          }
          slotLeft={
            ctaErrorAction ? (
              <Icon iconName={IconName.Warning} tw="text-color-warning" />
            ) : undefined
          }
        >
          {ctaErrorAction ?? formConfig.buttonLabel}
        </Button>
      </WithDetailsReceipt>
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
`;
const $ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}
`;
function useForm() {
  const rawParentSubaccountData = useAppSelector(BonsaiRaw.parentSubaccountBase);
  const rawRelevantMarkets = useAppSelector(BonsaiRaw.parentSubaccountRelevantMarkets);
  const canViewAccount = useAppSelector(calculateCanViewAccount);

  const inputs = useMemo(
    () => ({
      rawParentSubaccountData,
      rawRelevantMarkets,
      canViewAccount,
    }),
    [canViewAccount, rawParentSubaccountData, rawRelevantMarkets]
  );

  return useFormValues(AdjustIsolatedMarginFormFns, inputs);
}
