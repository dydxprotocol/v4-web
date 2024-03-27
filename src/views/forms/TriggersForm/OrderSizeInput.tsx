import { useCallback, useEffect, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { TriggerOrdersInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';

import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { getTriggerOrdersInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { OrderSizeSlider } from './OrderSizeSlider';

type ElementProps = {
  symbol: string;
  positionSize?: number;
  stepSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeInput = ({
  symbol,
  positionSize,
  stepSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const { size } = useSelector(getTriggerOrdersInputs, shallowEqual) || {};
  const sizeBN = MustBigNumber(size);
  const sizeInputNumber = sizeBN.toFixed(stepSizeDecimals || TOKEN_DECIMALS);

  console.log('Xcxc2', size, sizeInputNumber);

  const { stopLossOrder, takeProfitOrder } =
    useSelector(getTriggerOrdersInputs, shallowEqual) || {};

  const [shouldShowCustomAmount, setShouldShowCustomAmount] = useState(false);

  useEffect(() => {
    const notFullAmount = false;
    setShouldShowCustomAmount(notFullAmount);
  }, [stopLossOrder, takeProfitOrder]); // xcxc this might break if you're updating the order type

  const onSizeInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newSize = floatValue && positionSize ? Math.min(floatValue, positionSize) : null;
    abacusStateManager.setTriggerOrdersValue({
      value:
        formattedValue === ''
          ? null
          : MustBigNumber(newSize).toFixed(stepSizeDecimals || TOKEN_DECIMALS),
      field: TriggerOrdersInputField.size,
    });
  };

  return (
    <Collapsible
      slotTrigger={
        <Checkbox checked={shouldShowCustomAmount} onCheckedChange={setShouldShowCustomAmount} />
      }
      open={shouldShowCustomAmount}
      label={
        <WithTooltip tooltip="custom-amount">
          {stringGetter({ key: STRING_KEYS.CUSTOM_AMOUNT })}
        </WithTooltip>
      }
    >
      {/* TODO: CT-625 Update with values from abacus */}
      <Styled.SizeInputRow>
        <Styled.OrderSizeSlider
          className={className}
          positionSize={positionSize}
          stepSizeDecimals={stepSizeDecimals}
        />
        <FormInput
          type={InputType.Number}
          value={sizeInputNumber}
          slotRight={<Tag>{symbol}</Tag>}
          onInput={onSizeInput}
        />
      </Styled.SizeInputRow>
    </Collapsible>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.OrderSizeSlider = styled(OrderSizeSlider)`
  width: 100%;
`;

Styled.SizeInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
