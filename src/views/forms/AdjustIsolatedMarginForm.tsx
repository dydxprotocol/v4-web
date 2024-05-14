import { FormEvent, useMemo, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import type { SubaccountPosition } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';

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
import { getMarketConfig } from '@/state/perpetualsSelectors';

import { calculateCrossPositionMargin } from '@/lib/tradeData';

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
  const [marginAction, setMarginAction] = useState(MarginAction.ADD);
  const subaccountPosition = useSelector(getOpenPositionFromId(marketId));
  const { adjustedMmf, leverage, liquidationPrice, notionalTotal } = subaccountPosition ?? {};
  const marketConfig = useSelector(getMarketConfig(marketId));
  const { tickSizeDecimals } = marketConfig ?? {};

  /**
   * @todo: Replace with Abacus functionality
   */
  const [percent, setPercent] = useState('');
  const [amount, setAmount] = useState('');
  const onSubmit = () => {};

  const positionMargin = {
    current: calculateCrossPositionMargin({
      adjustedMmf: adjustedMmf?.current,
      notionalTotal: notionalTotal?.current,
    }).toFixed(tickSizeDecimals ?? USD_DECIMALS),
    postOrder: calculateCrossPositionMargin({
      adjustedMmf: adjustedMmf?.postOrder,
      notionalTotal: notionalTotal?.postOrder,
    }).toFixed(tickSizeDecimals ?? USD_DECIMALS),
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
          !!freeCollateral?.postOrder && freeCollateral?.current !== freeCollateral?.postOrder,
        value: freeCollateral?.current,
        newValue: freeCollateral?.postOrder,
        type: OutputType.Number,
      }),
      marginUsageDiffOutput: renderDiffOutput({
        withDiff: !!marginUsage?.postOrder && marginUsage?.current !== marginUsage?.postOrder,
        value: marginUsage?.current,
        newValue: marginUsage?.postOrder,
        type: OutputType.Percent,
      }),
      positionMarginDiffOutput: renderDiffOutput({
        withDiff: !!positionMargin.postOrder && positionMargin.current !== positionMargin.postOrder,
        value: positionMargin.current,
        newValue: positionMargin.postOrder,
        type: OutputType.Fiat,
      }),
      leverageDiffOutput: renderDiffOutput({
        withDiff: !!leverage?.postOrder && leverage?.current !== leverage?.postOrder,
        value: leverage?.current,
        newValue: leverage?.postOrder,
        type: OutputType.Multiple,
      }),
    }),
    [freeCollateral, marginUsage, positionMargin, leverage]
  );

  const formConfig =
    marginAction === MarginAction.ADD
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
        value={marginAction}
        onValueChange={setMarginAction}
        items={[
          { value: MarginAction.ADD, label: stringGetter({ key: STRING_KEYS.ADD_MARGIN }) },
          { value: MarginAction.REMOVE, label: stringGetter({ key: STRING_KEYS.REMOVE_MARGIN }) },
        ]}
      />

      <Styled.ToggleGroup
        items={Object.entries(SIZE_PERCENT_OPTIONS).map(([key, value]) => ({
          label: key,
          value: value.toString(),
        }))}
        value={percent}
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
        <Button action={ButtonAction.Primary}>{formConfig.buttonLabel}</Button>
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
