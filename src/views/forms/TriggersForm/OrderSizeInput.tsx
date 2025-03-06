import { useEffect, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getTriggersFormState } from '@/state/inputsSelectors';
import { triggersFormActions } from '@/state/triggersForm';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { AttemptNumber } from '@/lib/numbers';

import { OrderSizeSlider } from './OrderSizeSlider';

type ElementProps = {
  symbol: string;
  differingOrderSizes: boolean;
  size: string | null;
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
  const dispatch = useAppDispatch();

  const triggerFormInputValues = useAppSelector(getTriggersFormState);

  const [localSize, setLocalSize] = useState(size);

  useEffect(() => {
    setLocalSize(size);
  }, [size]);

  const onCustomAmountToggle = (isToggled: boolean) => {
    if (isToggled !== triggerFormInputValues.size.checked) {
      dispatch(triggersFormActions.setSizeChecked(isToggled));
    }
  };

  const setAbacusSize = (newSize: string) => {
    dispatch(triggersFormActions.setSize(newSize));
  };

  const onSizeInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    setLocalSize(formattedValue);
    setAbacusSize(formattedValue);
  };

  return (
    <Collapsible
      slotTrigger={
        <WithTooltip tooltip={differingOrderSizes ? 'unequal-order-sizes' : undefined}>
          <Checkbox
            id="order-size"
            disabled={differingOrderSizes}
            checked={triggerFormInputValues.size.checked}
            onCheckedChange={onCustomAmountToggle}
          />
        </WithTooltip>
      }
      label={
        <WithTooltip tooltip="custom-amount">
          {stringGetter({ key: STRING_KEYS.CUSTOM_AMOUNT })}
        </WithTooltip>
      }
      open={triggerFormInputValues.size.checked}
    >
      <div tw="flex items-center gap-0.25">
        <OrderSizeSlider
          setAbacusSize={(sizeString: string) => setAbacusSize(sizeString)}
          setOrderSizeInput={(sizeString: string) => setLocalSize(sizeString)}
          size={AttemptNumber(localSize) ?? null}
          positionSize={positionSize ?? undefined}
          stepSizeDecimals={stepSizeDecimals ?? TOKEN_DECIMALS}
          className={className}
          tw="w-full"
        />
        <FormInput
          type={InputType.Number}
          value={localSize?.toString()}
          slotRight={<Tag>{getDisplayableAssetFromBaseAsset(symbol)}</Tag>}
          onInput={onSizeInput}
        />
      </div>
    </Collapsible>
  );
};
