import type { Dispatch, SetStateAction } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { TradeInputField, Nullable } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';
import { PositionSide } from '@/constants/trade';

import { useStringGetter } from '@/hooks';
import { formMixins } from '@/styles/formMixins';
import { breakpoints } from '@/styles';

import { Input, InputType } from '@/components/Input';
import { PositionSideTag } from '@/components/PositionSideTag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithLabel } from '@/components/WithLabel';
import { WithTooltip } from '@/components/WithTooltip';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { getInputTradeData } from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import { getSelectedOrderSide, hasPositionSideChanged } from '@/lib/tradeData';

import { LeverageSlider } from './LeverageSlider';

type ElementProps = {
  leverageInputValue: string;
  setLeverageInputValue: (value: string) => void;
};

export const MarketLeverageInput = ({
  leverageInputValue,
  setLeverageInputValue,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const currentMarketConfig = useSelector(getCurrentMarketConfig, shallowEqual);
  const currentPositionData = useSelector(getCurrentMarketPositionData, shallowEqual);
  const inputTradeData = useSelector(getInputTradeData, shallowEqual);

  const { leverage, size: currentPositionSize } = currentPositionData || {};
  const { current: currentSize, postOrder: postOrderSize } = currentPositionSize || {};
  const { current: currentLeverage, postOrder: postOrderLeverage } = leverage || {};
  const { initialMarginFraction } = currentMarketConfig || {};
  const { side } = inputTradeData || {};
  const orderSide = getSelectedOrderSide(side);

  const { currentPositionSide, newPositionSide } = hasPositionSideChanged({
    currentSize,
    postOrderSize,
  });

  const maxLeverage = initialMarginFraction
    ? BIG_NUMBERS.ONE.div(initialMarginFraction)
    : MustBigNumber(10);

  const leveragePosition = postOrderLeverage ? newPositionSide : currentPositionSide;

  const onLeverageInput = ({ value, floatValue }: { value: string; floatValue?: number }) => {
    const newLeverage = MustBigNumber(floatValue).toFixed();

    if (value === '' || newLeverage === 'NaN' || !floatValue) {
      setLeverageInputValue('');
      abacusStateManager.setTradeValue({
        value: null,
        field: TradeInputField.leverage,
      });
    } else {
      updateLeverage(floatValue);
    }
  };

  const updateLeverage = (newLeverage: string | number) => {
    const newLeverageBN = MustBigNumber(newLeverage);
    const newLeverageSignedBN =
      leveragePosition === PositionSide.Short ||
      (leveragePosition === PositionSide.None && orderSide === OrderSide.SELL)
        ? newLeverageBN.abs().negated()
        : newLeverageBN.abs();

    setLeverageInputValue(newLeverageSignedBN.toString());

    abacusStateManager.setTradeValue({
      value: newLeverageSignedBN.toFixed(LEVERAGE_DECIMALS),
      field: TradeInputField.leverage,
    });
  };

  const onLeverageSideToggle = (e: Event) => {
    e.preventDefault();

    if (leveragePosition === PositionSide.None) return;

    const inputValue = leverageInputValue || currentLeverage;
    const newInputValue = MustBigNumber(inputValue).negated().toFixed(LEVERAGE_DECIMALS);

    setLeverageInputValue(newInputValue);
    abacusStateManager.setTradeValue({
      value: newInputValue,
      field: TradeInputField.leverage,
    });
  };

  const formattedLeverageValue = leverageInputValue
    ? ''
    : MustBigNumber(leverageInputValue).toFixed(LEVERAGE_DECIMALS);

  return (
    <>
      <Styled.InputContainer>
        <Styled.WithLabel
          key="leverage"
          label={
            <>
              <WithTooltip tooltip="leverage" side="right">
                {stringGetter({ key: STRING_KEYS.LEVERAGE })}
              </WithTooltip>

              <Styled.LeverageSide onClick={onLeverageSideToggle}>
                <PositionSideTag positionSide={leveragePosition} />
              </Styled.LeverageSide>
            </>
          }
        >
          <Styled.LeverageSlider
            leverage={currentLeverage}
            leverageInputValue={leverageInputValue}
            maxLeverage={maxLeverage}
            orderSide={orderSide}
            positionSide={currentPositionSide}
            setLeverageInputValue={setLeverageInputValue}
          />
        </Styled.WithLabel>
        <Styled.InnerInputContainer>
          <Input
            onInput={onLeverageInput}
            placeholder={`${MustBigNumber(currentLeverage).abs().toFixed(LEVERAGE_DECIMALS)}×`}
            type={InputType.Leverage}
            value={leverageInputValue ?? ''}
          />
        </Styled.InnerInputContainer>
      </Styled.InputContainer>

      <Styled.ToggleGroup
        items={[1, 2, 3, 5, 10].map((leverageAmount: number) => ({
          label: `${leverageAmount}×`,
          value: MustBigNumber(leverageAmount).toFixed(LEVERAGE_DECIMALS),
        }))}
        value={MustBigNumber(formattedLeverageValue).abs().toFixed(LEVERAGE_DECIMALS)} // sign agnostic
        onValueChange={updateLeverage}
        shape={ButtonShape.Rectangle}
      />
    </>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;

  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    --input-height: 4rem;
  }
`;

Styled.WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
`;

Styled.LeverageSlider = styled(LeverageSlider)`
  margin-top: 0.25rem;
`;

Styled.InnerInputContainer = styled.div`
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

Styled.LeverageSide = styled.div`
  cursor: pointer;
`;

Styled.ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}
`;
