import { FormEvent, useState } from 'react';

import { NumberFormatValues } from 'react-number-format';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { breakpoints } from '@/styles';
import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Input, InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';
import { Slider } from '@/components/Slider';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithLabel } from '@/components/WithLabel';

import { getInputTradeTargetLeverage } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

export const AdjustTargetLeverageForm = ({
  onSetTargetLeverage,
}: {
  onSetTargetLeverage: (value: string) => void;
}) => {
  const stringGetter = useStringGetter();
  const { adjustTargetLeverageLearnMore } = useURLConfigs();

  /**
   * @todo: Replace with Abacus functionality
   */
  const targetLeverage = useSelector(getInputTradeTargetLeverage);
  const [leverage, setLeverage] = useState(targetLeverage?.toString() ?? '');
  const leverageBN = MustBigNumber(leverage);

  return (
    <$Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();

        abacusStateManager.setTradeValue({
          value: leverage,
          field: TradeInputField.targetLeverage,
        });

        onSetTargetLeverage?.(leverage);
      }}
    >
      <$Description>
        {stringGetter({ key: STRING_KEYS.ADJUST_TARGET_LEVERAGE_DESCRIPTION })}
        <Link withIcon href={adjustTargetLeverageLearnMore}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
        </Link>
      </$Description>

      <$InputContainer>
        <$WithLabel label={stringGetter({ key: STRING_KEYS.TARGET_LEVERAGE })}>
          <$LeverageSlider
            min={1}
            max={10}
            value={MustBigNumber(leverage).abs().toNumber()}
            onSliderDrag={([value]: number[]) => setLeverage(value.toString())}
            onValueCommit={([value]: number[]) => setLeverage(value.toString())}
          />
        </$WithLabel>
        <$InnerInputContainer>
          <Input
            placeholder={`${MustBigNumber(leverage).abs().toFixed(LEVERAGE_DECIMALS)}×`}
            type={InputType.Leverage}
            value={leverage}
            onChange={({ floatValue }: NumberFormatValues) =>
              setLeverage(floatValue?.toString() ?? '')
            }
          />
        </$InnerInputContainer>
      </$InputContainer>

      <$ToggleGroup
        items={[1, 2, 3, 5, 10].map((leverageAmount: number) => ({
          label: `${leverageAmount}×`,
          value: MustBigNumber(leverageAmount).toFixed(LEVERAGE_DECIMALS),
        }))}
        value={leverageBN.abs().toFixed(LEVERAGE_DECIMALS)} // sign agnostic
        onValueChange={(value: string) => setLeverage(value)}
        shape={ButtonShape.Rectangle}
      />

      <WithDetailsReceipt
        detailItems={[
          {
            key: 'target-leverage',
            label: stringGetter({ key: STRING_KEYS.TARGET_LEVERAGE }),
            value: (
              <DiffOutput
                type={OutputType.Multiple}
                withDiff={leverageBN.gt(0) && !leverageBN.eq(1)}
                value={1}
                newValue={leverageBN.toFixed(LEVERAGE_DECIMALS)}
                fractionDigits={LEVERAGE_DECIMALS}
              />
            ),
          },
        ]}
      >
        <Button type={ButtonType.Submit} action={ButtonAction.Primary}>
          {stringGetter({ key: STRING_KEYS.CONFIRM_LEVERAGE })}
        </Button>
      </WithDetailsReceipt>
    </$Form>
  );
};

const $Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    margin-left: 3px;
  }
`;

const $Form = styled.form`
  ${formMixins.transfersForm}
`;
const $InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;

  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    --input-height: 4rem;
  }
`;
const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
`;
const $LeverageSlider = styled(Slider)`
  margin-top: 0.25rem;

  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    var(--color-text-2) 100%
  );
`;
const $InnerInputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-backgroundColor: var(--color-layer-5);
  --input-borderColor: var(--color-layer-7);
  --input-height: 2.25rem;
  --input-width: 5rem;

  margin-left: 0.25rem;

  input {
    text-align: end;
    padding: 0 var(--form-input-paddingX);
  }

  @media ${breakpoints.tablet} {
    --input-height: 2.5rem;
  }
`;
const $ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}
`;
