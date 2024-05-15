import { FormEvent, useEffect, useMemo } from 'react';

import { NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  AdjustIsolatedMarginInputField,
  HumanReadableSubaccountTransferPayload,
  IsolatedMarginAdjustmentType,
  Nullable,
  type SubaccountPosition,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useStringGetter, useSubaccount } from '@/hooks';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { GradientCard } from '@/components/GradientCard';
import { InputType } from '@/components/Input';
import { OutputType } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getOpenPositionFromId, getSubaccount } from '@/state/accountSelectors';
import { getAdjustIsolatedMarginInputs } from '@/state/inputsSelectors';
import { getMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';

type ElementProps = {
  marketId: SubaccountPosition['id'];
};

enum MarginAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

const SIZE_PERCENT_OPTIONS = {
  '5%': '0.05',
  '10%': '0.1',
  '25%': '0.25',
  '50%': '0.5',
  '75%': '0.75',
};

export const AdjustIsolatedMarginForm = ({ marketId }: ElementProps) => {
  const stringGetter = useStringGetter();
  const subaccountPosition = useSelector(getOpenPositionFromId(marketId));
  const { childSubaccountNumber, leverage, liquidationPrice, quoteBalance } =
    subaccountPosition ?? {};
  const marketConfig = useSelector(getMarketConfig(marketId));
  const adjustIsolatedMarginInputs = useSelector(getAdjustIsolatedMarginInputs, shallowEqual);
  const { type, amount, amountPercent } = adjustIsolatedMarginInputs ?? {};
  const { tickSizeDecimals } = marketConfig ?? {};

  useEffect(() => {
    console.log('childSubaccountNumber', childSubaccountNumber);
    abacusStateManager.setAdjustIsolatedMarginValue({
      value: childSubaccountNumber,
      field: AdjustIsolatedMarginInputField.ChildSubaccountNumber,
    });
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

  const setMarginAction = (type: string) => {
    abacusStateManager.setAdjustIsolatedMarginValue({
      value: type,
      field: AdjustIsolatedMarginInputField.Type,
    });
  };

  const { adjustIsolatedMarginOfPosition } = useSubaccount();

  const onSubmit = () => {
    try {
      adjustIsolatedMarginOfPosition({
        onError: (errorParams) => {
          console.log({ errorParams });
        },
        onSuccess: (
          subaccountTransferPayload?: Nullable<HumanReadableSubaccountTransferPayload>
        ) => {
          console.log({ subaccountTransferPayload });
        },
      });
    } catch (error) {
      console.log('error', error);
    }
  };

  const { freeCollateral, marginUsage } = useSelector(getSubaccount, shallowEqual) ?? {};

  const renderDiffOutput = ({
    type,
    value,
    newValue,
    withDiff,
  }: Pick<Parameters<typeof DiffOutput>[0], 'type' | 'value' | 'newValue' | 'withDiff'>) => (
    <DiffOutput type={type} value={value} newValue={newValue} withDiff={withDiff} />
  );

  const {
    freeCollateralDiffOutput,
    marginUsageDiffOutput,
    positionMarginDiffOutput,
    leverageDiffOutput,
  } = useMemo(
    () => ({
      freeCollateralDiffOutput: renderDiffOutput({
        withDiff:
          !!freeCollateral?.postOrder && freeCollateral.current !== freeCollateral?.postOrder,
        value: freeCollateral?.current,
        newValue: freeCollateral?.postOrder,
        type: OutputType.Fiat,
      }),
      marginUsageDiffOutput: renderDiffOutput({
        withDiff: !!marginUsage?.postOrder && marginUsage.current !== marginUsage?.postOrder,
        value: marginUsage?.current,
        newValue: marginUsage?.postOrder,
        type: OutputType.Percent,
      }),
      positionMarginDiffOutput: renderDiffOutput({
        withDiff: !!quoteBalance?.postOrder && quoteBalance.current !== quoteBalance.postOrder,
        value: quoteBalance?.current,
        newValue: quoteBalance?.postOrder,
        type: OutputType.Fiat,
      }),
      leverageDiffOutput: renderDiffOutput({
        withDiff: !!leverage?.postOrder && leverage.current !== leverage?.postOrder,
        value: leverage?.current,
        newValue: leverage?.postOrder,
        type: OutputType.Multiple,
      }),
    }),
    [freeCollateral, marginUsage, quoteBalance, leverage]
  );

  const formConfig =
    type === IsolatedMarginAdjustmentType.Add
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

  const CenterElement = false ? (
    <AlertMessage type={AlertType.Error}>Placeholder Error</AlertMessage>
  ) : (
    <Styled.GradientCard fromColor="neutral" toColor="negative">
      <Styled.Column>
        <Styled.TertiarySpan>{stringGetter({ key: STRING_KEYS.ESTIMATED })}</Styled.TertiarySpan>
        <span>{stringGetter({ key: STRING_KEYS.LIQUIDATION_PRICE })}</span>
      </Styled.Column>
      <div>
        <DiffOutput
          withDiff={
            !!liquidationPrice?.postOrder &&
            liquidationPrice?.current !== liquidationPrice?.postOrder
          }
          sign={NumberSign.Negative}
          layout="column"
          value={liquidationPrice?.current}
          newValue={liquidationPrice?.postOrder}
          type={OutputType.Fiat}
          fractionDigits={tickSizeDecimals}
        />
      </div>
    </Styled.GradientCard>
  );

  return (
    <Styled.Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <ToggleGroup
        value={type?.name ?? IsolatedMarginAdjustmentType.Add.name}
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

      <Styled.ToggleGroup
        items={Object.entries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
          label: key,
          value: value.toString(),
        }))}
        value={amountPercent ?? ''}
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
        <Button type={ButtonType.Submit} action={ButtonAction.Primary}>
          {formConfig.buttonLabel}
        </Button>
      </WithDetailsReceipt>
    </Styled.Form>
  );
};

const Styled = {
  Form: styled.form`
    ${formMixins.transfersForm}
  `,
  ToggleGroup: styled(ToggleGroup)`
    ${formMixins.inputToggleGroup}
  `,
  GradientCard: styled(GradientCard)`
    ${layoutMixins.spacedRow}
    height: 4rem;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    align-items: center;
  `,
  Column: styled.div`
    ${layoutMixins.column}
    font: var(--font-small-medium);
  `,
  TertiarySpan: styled.span`
    color: var(--color-text-0);
  `,
};
