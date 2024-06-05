import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';
import { PositionSide } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Input, InputType } from '@/components/Input';
import { PositionSideTag } from '@/components/PositionSideTag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithLabel } from '@/components/WithLabel';
import { WithTooltip } from '@/components/WithTooltip';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
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

  const currentMarketConfig = useAppSelector(getCurrentMarketConfig, shallowEqual);
  const currentPositionData = useAppSelector(getCurrentMarketPositionData, shallowEqual);
  const inputTradeData = useAppSelector(getInputTradeData, shallowEqual);

  const { leverage, size: currentPositionSize } = currentPositionData ?? {};
  const { current: currentSize, postOrder: postOrderSize } = currentPositionSize ?? {};
  const { current: currentLeverage, postOrder: postOrderLeverage } = leverage ?? {};
  const { initialMarginFraction, effectiveInitialMarginFraction } = currentMarketConfig ?? {};
  const { side } = inputTradeData ?? {};
  const orderSide = getSelectedOrderSide(side);

  const { currentPositionSide, newPositionSide } = hasPositionSideChanged({
    currentSize,
    postOrderSize,
  });

  const preferredIMF = effectiveInitialMarginFraction ?? initialMarginFraction;

  const maxLeverage = preferredIMF ? BIG_NUMBERS.ONE.div(preferredIMF) : MustBigNumber(10);

  const leverageOptions = maxLeverage.lt(10) ? [1, 2, 3, 4, 5] : [1, 2, 3, 5, 10];

  const leveragePosition = postOrderLeverage ? newPositionSide : currentPositionSide;

  const getSignedLeverage = (newLeverage: string | number) => {
    const newLeverageBN = MustBigNumber(newLeverage);
    const newLeverageBNCapped = newLeverageBN.isGreaterThan(maxLeverage)
      ? maxLeverage
      : newLeverageBN;
    const newLeverageSignedBN =
      leveragePosition === PositionSide.Short ||
      (leveragePosition === PositionSide.None && orderSide === OrderSide.SELL)
        ? newLeverageBNCapped.abs().negated()
        : newLeverageBNCapped.abs();

    return newLeverageSignedBN.toFixed(LEVERAGE_DECIMALS);
  };

  const onLeverageInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    setLeverageInputValue(formattedValue);
    const newLeverage = MustBigNumber(floatValue).toFixed();

    abacusStateManager.setTradeValue({
      value:
        formattedValue === '' || newLeverage === 'NaN' ? null : getSignedLeverage(formattedValue),
      field: TradeInputField.leverage,
    });
  };

  const updateLeverage = (newLeverage: string | number) => {
    const newLeverageSigned = getSignedLeverage(newLeverage);

    setLeverageInputValue(newLeverageSigned);

    abacusStateManager.setTradeValue({
      value: newLeverageSigned,
      field: TradeInputField.leverage,
    });
  };

  const onLeverageSideToggle = (e: React.MouseEvent<HTMLDivElement>) => {
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
      <$InputContainer>
        <$WithLabel
          key="leverage"
          label={
            <>
              <WithTooltip tooltip="leverage" side="right">
                {stringGetter({ key: STRING_KEYS.LEVERAGE })}
              </WithTooltip>

              <$LeverageSide onClick={onLeverageSideToggle}>
                <PositionSideTag positionSide={leveragePosition} />
              </$LeverageSide>
            </>
          }
        >
          <$LeverageSlider
            leverage={currentLeverage}
            leverageInputValue={getSignedLeverage(leverageInputValue)}
            maxLeverage={maxLeverage}
            orderSide={orderSide}
            positionSide={currentPositionSide}
            setLeverageInputValue={setLeverageInputValue}
          />
        </$WithLabel>
        <$InnerInputContainer>
          <Input
            onInput={onLeverageInput}
            placeholder={`${MustBigNumber(currentLeverage).abs().toFixed(LEVERAGE_DECIMALS)}×`}
            type={InputType.Leverage}
            value={leverageInputValue ?? ''}
          />
        </$InnerInputContainer>
      </$InputContainer>

      <$ToggleGroup
        items={leverageOptions.map((leverageAmount: number) => ({
          label: `${leverageAmount}×`,
          value: MustBigNumber(leverageAmount).toFixed(LEVERAGE_DECIMALS),
          disabled: maxLeverage.lt(leverageAmount),
        }))}
        value={MustBigNumber(formattedLeverageValue).abs().toFixed(LEVERAGE_DECIMALS)} // sign agnostic
        onValueChange={updateLeverage}
        shape={ButtonShape.Rectangle}
      />
    </>
  );
};
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

const $LeverageSlider = styled(LeverageSlider)`
  margin-top: 0.25rem;
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

const $LeverageSide = styled.div`
  cursor: pointer;
`;

const $ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}
`;
