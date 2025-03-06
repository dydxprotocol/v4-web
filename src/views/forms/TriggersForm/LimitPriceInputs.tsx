import { useState } from 'react';

import { shallowEqual, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppSelector } from '@/state/appTypes';
import { getTriggersFormState, getTriggersFormSummary } from '@/state/inputsSelectors';
import { triggersFormActions } from '@/state/triggersForm';

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
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const triggerFormInputValues = useAppSelector(getTriggersFormState);
  const triggerFormSummary = useAppSelector(getTriggersFormSummary, shallowEqual);

  const [shouldShowLimitPrice, setShouldShowLimitPrice] = useState(existsLimitOrder);

  const decimals = tickSizeDecimals ?? USD_DECIMALS;

  const onToggleLimit = (isLimitChecked: boolean) => {
    if (isLimitChecked !== triggerFormInputValues.showLimits) {
      dispatch(triggersFormActions.setShowLimits(isLimitChecked));
    }
    if (isLimitChecked !== shouldShowLimitPrice) {
      setShouldShowLimitPrice(isLimitChecked);
    }
  };

  const onSetTpLimit = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    onToggleLimit(true);
    dispatch(triggersFormActions.setTakeProfitLimitPrice(formattedValue));
  };

  const onSetSlLimit = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    onToggleLimit(true);
    dispatch(triggersFormActions.setStopLossLimitPrice(formattedValue));
  };

  return (
    <Collapsible
      className={className}
      slotTrigger={
        <Checkbox id="sltp-limit" checked={shouldShowLimitPrice} onCheckedChange={onToggleLimit} />
      }
      open={shouldShowLimitPrice}
      label={
        <WithTooltip tooltip="limit-price">
          {stringGetter({ key: STRING_KEYS.LIMIT_PRICE })}
        </WithTooltip>
      }
    >
      <$InputsRow>
        {!multipleTakeProfitOrders && (
          <FormInput
            id="TP-limit"
            decimals={decimals}
            value={
              triggerFormInputValues.takeProfitOrder.limitPrice ??
              triggerFormSummary.summary.takeProfitOrder.limitPrice
            }
            type={InputType.Currency}
            label={
              <>
                {stringGetter({ key: STRING_KEYS.TP_LIMIT })}
                <Tag>USD</Tag>
              </>
            }
            onInput={onSetTpLimit}
          />
        )}
        {!multipleStopLossOrders && (
          <FormInput
            id="SL-limit"
            decimals={decimals}
            value={
              triggerFormInputValues.stopLossOrder.limitPrice ??
              triggerFormSummary.summary.stopLossOrder.limitPrice
            }
            type={InputType.Currency}
            label={
              <>
                {stringGetter({ key: STRING_KEYS.SL_LIMIT })}
                <Tag>USD</Tag>
              </>
            }
            onInput={onSetSlLimit}
          />
        )}
      </$InputsRow>
    </Collapsible>
  );
};
const $InputsRow = styled.span`
  ${layoutMixins.flexEqualColumns}
  gap: 1ch;
`;
