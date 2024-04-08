import { useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import {
  AbacusOrderType,
  TriggerOrdersInputField,
  TriggerOrdersInputFields,
} from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { getTriggerOrdersInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  existsLimitOrder: boolean;
  multipleTakeProfitOrders: boolean;
  multipleStopLossOrders: boolean;
  tickSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const LimitPriceInputs = ({
  existsLimitOrder,
  multipleTakeProfitOrders,
  multipleStopLossOrders,
  tickSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();

  const { stopLossOrder, takeProfitOrder } =
    useSelector(getTriggerOrdersInputs, shallowEqual) || {};

  const [shouldShowLimitPrice, setShouldShowLimitPrice] = useState(existsLimitOrder);

  const decimals = tickSizeDecimals ?? USD_DECIMALS;

  const onToggleLimit = (isLimitChecked: boolean) => {
    if (!isLimitChecked) {
      abacusStateManager.setTriggerOrdersValue({
        value: AbacusOrderType.takeProfitMarket.rawValue,
        field: TriggerOrdersInputField.takeProfitOrderType,
      });
      abacusStateManager.setTriggerOrdersValue({
        value: null,
        field: TriggerOrdersInputField.takeProfitLimitPrice,
      });
      abacusStateManager.setTriggerOrdersValue({
        value: AbacusOrderType.stopMarket.rawValue,
        field: TriggerOrdersInputField.stopLossOrderType,
      });
      abacusStateManager.setTriggerOrdersValue({
        value: null,
        field: TriggerOrdersInputField.stopLossLimitPrice,
      });
    }
    setShouldShowLimitPrice(isLimitChecked);
  };

  const onLimitInput =
    (field: TriggerOrdersInputFields) =>
    ({ floatValue, formattedValue }: { floatValue?: number; formattedValue: string }) => {
      const newLimitPrice = MustBigNumber(floatValue).toFixed(decimals);

      abacusStateManager.setTriggerOrdersValue({
        value: formattedValue === '' || newLimitPrice === 'NaN' ? null : newLimitPrice,
        field,
      });
    };

  return (
    <>
      <Collapsible
        className={className}
        slotTrigger={<Checkbox checked={shouldShowLimitPrice} onCheckedChange={onToggleLimit} />}
        open={shouldShowLimitPrice}
        label={
          <WithTooltip tooltip="limit-price">
            {stringGetter({ key: STRING_KEYS.LIMIT_PRICE })}
          </WithTooltip>
        }
      >
        {
          <Styled.InputsRow>
            {!multipleTakeProfitOrders && (
              <FormInput
                id="TP-limit"
                decimals={decimals}
                value={takeProfitOrder?.price?.limitPrice}
                label={
                  <>
                    {stringGetter({ key: STRING_KEYS.TP_LIMIT })}
                    <Tag>USD</Tag>
                  </>
                }
                onInput={onLimitInput(TriggerOrdersInputField.takeProfitLimitPrice)}
              />
            )}
            {!multipleStopLossOrders && (
              <FormInput
                id="SL-limit"
                decimals={decimals}
                value={stopLossOrder?.price?.limitPrice}
                label={
                  <>
                    {stringGetter({ key: STRING_KEYS.SL_LIMIT })}
                    <Tag>USD</Tag>
                  </>
                }
                onInput={onLimitInput(TriggerOrdersInputField.stopLossLimitPrice)}
              />
            )}
          </Styled.InputsRow>
        }
      </Collapsible>
    </>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.InputsRow = styled.span`
  ${layoutMixins.flexEqualColumns}
  gap: 1ch;
`;
