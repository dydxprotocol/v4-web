import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { TriggerOrdersInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { OrderSizeSlider } from './OrderSizeSlider';

type ElementProps = {
  symbol: string;
  differingOrderSizes: boolean;
  size: number | null;
  positionSize: number | null;
  stepSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeInput = ({
  symbol,
  differingOrderSizes,
  size,
  positionSize,
  stepSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const [shouldShowCustomAmount, setShouldShowCustomAmount] = useState(false);
  const [orderSize, setOrderSize] = useState(size);

  useEffect(() => {
    setOrderSize(size);
    setShouldShowCustomAmount(!!(size && size !== positionSize));
  }, [size]);

  const onCustomAmountToggle = (isToggled: boolean) => {
    if (!isToggled) {
      // Default to full position size
      abacusStateManager.setTriggerOrdersValue({
        value: MustBigNumber(positionSize).toString(),
        field: TriggerOrdersInputField.size,
      });
    }
    setShouldShowCustomAmount(isToggled);
  };

  const setAbacusSize = (newSize: number | null) => {
    const newSizeString = MustBigNumber(
      newSize && positionSize ? Math.min(positionSize, newSize) : newSize
    ).toString();

    abacusStateManager.setTriggerOrdersValue({
      value: newSize !== null ? newSizeString : null,
      field: TriggerOrdersInputField.size,
    });
  };

  const onSizeInput = ({ floatValue }: { floatValue?: number }) => {
    if (floatValue) {
      setOrderSize(Math.min(floatValue, positionSize ?? 0));
      setAbacusSize(floatValue);
    } else {
      setOrderSize(null);
      setAbacusSize(null);
    }
  };

  return (
    <Collapsible
      slotTrigger={
        <WithTooltip tooltip={differingOrderSizes ? 'unequal-order-sizes' : undefined}>
          <Checkbox
            id="order-size"
            disabled={differingOrderSizes}
            checked={shouldShowCustomAmount}
            onCheckedChange={onCustomAmountToggle}
          />
        </WithTooltip>
      }
      label={
        <WithTooltip tooltip="custom-amount">
          {stringGetter({ key: STRING_KEYS.CUSTOM_AMOUNT })}
        </WithTooltip>
      }
      open={shouldShowCustomAmount}
    >
      <$SizeInputRow>
        <$OrderSizeSlider
          setAbacusSize={(sizeString: string) => setAbacusSize(parseFloat(sizeString))}
          setOrderSizeInput={(sizeString: string) => setOrderSize(parseFloat(sizeString))}
          size={orderSize}
          positionSize={positionSize ?? undefined}
          stepSizeDecimals={stepSizeDecimals ?? TOKEN_DECIMALS}
          className={className}
        />
        <FormInput
          type={InputType.Number}
          value={orderSize?.toString()}
          slotRight={<Tag>{symbol}</Tag>}
          onInput={onSizeInput}
        />
      </$SizeInputRow>
    </Collapsible>
  );
};
const $OrderSizeSlider = styled(OrderSizeSlider)`
  width: 100%;
`;

const $SizeInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
