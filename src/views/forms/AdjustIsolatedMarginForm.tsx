import { FormEvent, useEffect, useMemo, useState } from 'react';

import { NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  AbacusPositionSide,
  AdjustIsolatedMarginInputField,
  IsolatedMarginAdjustmentType,
  type SubaccountPosition,
} from '@/constants/abacus';
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

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { GradientCard } from '@/components/GradientCard';
import { InputType } from '@/components/Input';
import { OutputType, ShowSign } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getOpenPositionFromId } from '@/state/accountSelectors';
import { getAdjustIsolatedMarginInputs } from '@/state/inputsSelectors';
import { getMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  marketId: SubaccountPosition['id'];
  onIsolatedMarginAdjustment?(): void;
};

const SIZE_PERCENT_OPTIONS = {
  '5%': '0.05',
  '10%': '0.1',
  '25%': '0.25',
  '50%': '0.5',
  '75%': '0.75',
};

export const AdjustIsolatedMarginForm = ({
  marketId,
  onIsolatedMarginAdjustment,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const subaccountPosition = useSelector(getOpenPositionFromId(marketId));
  const { childSubaccountNumber, side } = subaccountPosition ?? {};
  const marketConfig = useSelector(getMarketConfig(marketId));
  const adjustIsolatedMarginInputs = useSelector(getAdjustIsolatedMarginInputs, shallowEqual);

  const {
    type: isolatedMarginAdjustmentType,
    amount,
    amountPercent,
    summary,
  } = adjustIsolatedMarginInputs ?? {};
  const { tickSizeDecimals } = marketConfig ?? {};

  useEffect(() => {
    abacusStateManager.setAdjustIsolatedMarginValue({
      value: childSubaccountNumber,
      field: AdjustIsolatedMarginInputField.ChildSubaccountNumber,
    });

    return () => {
      abacusStateManager.setAdjustIsolatedMarginValue({
        value: null,
        field: AdjustIsolatedMarginInputField.ChildSubaccountNumber,
      });
    };
  }, []);

  const setAmount = ({ floatValue }: NumberFormatValues) => {
    abacusStateManager.setAdjustIsolatedMarginValue({
      value: floatValue,
      field: AdjustIsolatedMarginInputField.Amount,
    });
  };

  const setPercent = (value: string) => {
    abacusStateManager.setAdjustIsolatedMarginValue({
      value,
      field: AdjustIsolatedMarginInputField.AmountPercent,
    });
  };

  const setMarginAction = (marginAction: string) => {
    abacusStateManager.setAdjustIsolatedMarginValue({
      value: marginAction,
      field: AdjustIsolatedMarginInputField.Type,
    });
  };

  const { adjustIsolatedMarginOfPosition } = useSubaccount();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    adjustIsolatedMarginOfPosition({
      onError: (errorParams) => {
        setIsSubmitting(false);
        if (errorParams?.errorStringKey) {
          setErrorMessage(stringGetter({ key: errorParams.errorStringKey }));
        }
      },
      onSuccess: () => {
        setIsSubmitting(false);
        abacusStateManager.clearAdjustIsolatedMarginInputValues();
        onIsolatedMarginAdjustment?.();
      },
    });
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

  const {
    crossFreeCollateral,
    crossFreeCollateralUpdated,
    crossMarginUsage,
    crossMarginUsageUpdated,
    positionMargin,
    positionMarginUpdated,
    positionLeverage,
    positionLeverageUpdated,
    liquidationPrice,
    liquidationPriceUpdated,
  } = summary ?? {};

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
      positionMargin,
      positionMarginUpdated,
      positionLeverage,
      positionLeverageUpdated,
    ]
  );

  const formConfig =
    isolatedMarginAdjustmentType === IsolatedMarginAdjustmentType.Add
      ? {
          formLabel: stringGetter({ key: STRING_KEYS.ADDING }),
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
          formLabel: stringGetter({ key: STRING_KEYS.REMOVING }),
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
    if (liquidationPriceUpdated && liquidationPrice) {
      const increasedLiquidationPrice = liquidationPriceUpdated > liquidationPrice;
      if (side?.current === AbacusPositionSide.LONG) {
        return increasedLiquidationPrice ? 'negative' : 'positive';
      }

      return increasedLiquidationPrice ? 'positive' : 'negative';
    }

    // Position did not have a liq. price prior to the adjustment
    if (liquidationPriceUpdated) {
      return 'negative';
    }

    return 'neutral';
  }, [liquidationPrice, liquidationPriceUpdated, side]);

  const CenterElement = errorMessage ? (
    <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>
  ) : (
    <$GradientCard fromColor="neutral" toColor={gradientToColor}>
      <$Column>
        <$TertiarySpan>{stringGetter({ key: STRING_KEYS.ESTIMATED })}</$TertiarySpan>
        <span>{stringGetter({ key: STRING_KEYS.LIQUIDATION_PRICE })}</span>
      </$Column>
      <div>
        <DiffOutput
          withDiff={!!liquidationPriceUpdated && liquidationPrice !== liquidationPriceUpdated}
          sign={NumberSign.Negative}
          layout="column"
          value={liquidationPrice}
          newValue={liquidationPriceUpdated}
          type={OutputType.Fiat}
          fractionDigits={tickSizeDecimals}
        />
      </div>
    </$GradientCard>
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
        value={isolatedMarginAdjustmentType?.name ?? IsolatedMarginAdjustmentType.Add.name}
        onValueChange={setMarginAction}
        items={[
          {
            value: IsolatedMarginAdjustmentType.Add.name,
            label: stringGetter({ key: STRING_KEYS.ADD_MARGIN }),
          },
          {
            value: IsolatedMarginAdjustmentType.Remove.name,
            label: stringGetter({ key: STRING_KEYS.REMOVE_MARGIN }),
          },
        ]}
      />

      <$ToggleGroup
        items={Object.entries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
          label: key,
          value: value.toString(),
        }))}
        value={MustBigNumber(amountPercent).toFixed(PERCENT_DECIMALS)}
        onValueChange={setPercent}
        shape={ButtonShape.Rectangle}
      />

      <WithDetailsReceipt side="bottom" detailItems={formConfig.inputReceiptItems}>
        <FormInput
          type={InputType.Currency}
          label={formConfig.formLabel}
          value={amount}
          onChange={setAmount}
        />
      </WithDetailsReceipt>

      {CenterElement}

      <WithDetailsReceipt detailItems={formConfig.receiptItems}>
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          disabled={isSubmitting}
          state={isSubmitting ? ButtonState.Loading : ButtonState.Default}
        >
          {formConfig.buttonLabel}
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
const $GradientCard = styled(GradientCard)`
  ${layoutMixins.spacedRow}
  height: 4rem;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  align-items: center;
`;
const $Column = styled.div`
  ${layoutMixins.column}
  font: var(--font-small-medium);
`;
const $TertiarySpan = styled.span`
  color: var(--color-text-0);
`;
